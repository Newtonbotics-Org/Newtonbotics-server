const ACADEMIC_TIME_ZONE = 'Asia/Kolkata';

const getAcademicStartDateParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ACADEMIC_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
};

function getAcademicStartYear(date = new Date()) {
  const { year, month, day } = getAcademicStartDateParts(date);
  return month > 8 || (month === 8 && day >= 10) ? year : year - 1;
}

function getAcademicYearStatus(user, date = new Date()) {
  const academicStartYear = Number(user?.academicStartYear);
  const currentAcademicStartYear = getAcademicStartYear(date);
  const isVerified = Number.isInteger(academicStartYear)
    && academicStartYear >= 2000
    && academicStartYear <= currentAcademicStartYear;

  if (isVerified) {
    const yearOfStudy = currentAcademicStartYear - academicStartYear + 1;
    return {
      yearOfStudy,
      isAlumni: yearOfStudy >= 5,
      academicYearReviewRequired: false,
    };
  }

  const yearOfStudy = Number.isInteger(user?.yearOfStudy) ? user.yearOfStudy : null;
  return {
    yearOfStudy,
    isAlumni: yearOfStudy !== null && yearOfStudy >= 5,
    academicYearReviewRequired: true,
  };
}

module.exports = { getAcademicStartYear, getAcademicYearStatus };