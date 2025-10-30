/*
  One-time repair script to backfill missing teamMembers.userName on Project documents.
  Usage examples:
    NODE_ENV=production MONGODB_URI="mongodb+srv://..." node scripts/fixProjectTeamMemberNames.js
    node scripts/fixProjectTeamMemberNames.js --project 68f3d44daae2b97eb7be7571 --dry
*/

/* eslint-disable no-console */
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/database');
const Project = require('../src/models/Project');
const User = require('../src/models/User');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, projectId: null, limit: 0 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--dry' || args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--project' && args[i + 1]) {
      opts.projectId = args[i + 1];
      i += 1;
    } else if (args[i] === '--limit' && args[i + 1]) {
      opts.limit = parseInt(args[i + 1], 10) || 0;
      i += 1;
    }
  }
  return opts;
}

async function main() {
  const { dryRun, projectId, limit } = parseArgs();
  await connectDB();

  const matchMissingName = {
    teamMembers: {
      $elemMatch: {
        $or: [
          { userName: { $exists: false } },
          { userName: null },
          { userName: '' },
        ],
      },
    },
  };

  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
    matchMissingName._id = new mongoose.Types.ObjectId(projectId);
  }

  const cursor = Project.find(matchMissingName)
    .select({ teamMembers: 1, title: 1 })
    .cursor();

  let processedProjects = 0;
  let updatedMembers = 0;
  let skippedMembers = 0;

  // Optional limit on number of projects
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const project = await cursor.next();
    if (!project) break;
    processedProjects += 1;
    if (limit && processedProjects > limit) break;

    const membersNeedingName = project.teamMembers.filter(m => m && m.userId && (!m.userName || m.userName.trim() === ''));
    const userIds = [...new Set(membersNeedingName.map(m => m.userId.toString()))];
    // eslint-disable-next-line no-await-in-loop
    const users = await User.find({ _id: { $in: userIds } }, 'firstName lastName isActive');
    const idToUser = new Map(users.map(u => [u._id.toString(), u]));

    let changed = false;
    project.teamMembers.forEach(m => {
      if (m && m.userId && (!m.userName || m.userName.trim() === '')) {
        const u = idToUser.get(m.userId.toString());
        if (u) {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
          if (fullName) {
            m.userName = fullName;
            changed = true;
            updatedMembers += 1;
          } else {
            skippedMembers += 1;
          }
        } else {
          skippedMembers += 1;
        }
      }
    });

    if (changed) {
      console.log(`[Project ${project._id}] ${project.title || ''} - updating missing member names (${membersNeedingName.length})${dryRun ? ' [dry-run]' : ''}`);
      if (!dryRun) {
        // eslint-disable-next-line no-await-in-loop
        await project.save();
      }
    }
  }

  console.log(`Processed projects: ${processedProjects}`);
  console.log(`Updated members: ${updatedMembers}`);
  console.log(`Skipped members (no user found or no name): ${skippedMembers}`);

  await disconnectDB();
}

main().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(err => {
  console.error('Repair script failed:', err);
  process.exit(1);
});


