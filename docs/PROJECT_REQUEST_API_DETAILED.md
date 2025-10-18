# Project Request API - Complete Documentation

This document provides comprehensive API endpoints specifically for Project Request functionality with detailed request/response examples.

## Authentication

All private endpoints require authentication with a valid JWT token:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📋 Project Request APIs

### 1. List All Project Requests
**Endpoint:** `GET /api/project-requests`

**Access:** Public (optional authentication)

**Query Parameters:**
- `status` (optional): `pending`, `under_review`, `approved`, `rejected`, `on_hold`
- `mentorId` (optional): Filter by mentor ID
- `submittedBy` (optional): Filter by submitter ID
- `limit` (optional): 1-100, default: 20
- `skip` (optional): Default: 0

**Example Request:**
```bash
GET /api/project-requests?status=pending&limit=10&skip=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "68f2db7b640a945ff91190df",
        "title": "AI-Powered Robot Navigation System",
        "description": "Develop an autonomous robot navigation system using AI and computer vision for warehouse automation",
        "objectives": [
          "Implement SLAM (Simultaneous Localization and Mapping) algorithm",
          "Create obstacle avoidance system using computer vision",
          "Develop path planning algorithm for optimal route calculation",
          "Integrate real-time sensor fusion for accurate positioning"
        ],
        "expectedOutcomes": [
          "Fully autonomous robot capable of warehouse navigation",
          "Research paper publication in robotics conference",
          "Open source code repository with documentation",
          "Patent application for novel navigation algorithm"
        ],
        "teamSize": 4,
        "estimatedDurationMonths": 6,
        "budgetEstimate": 5000,
        "requiredResources": [
          "Robotics lab access",
          "Computer vision cameras",
          "Development hardware (GPUs)",
          "Testing environment setup"
        ],
        "mentorId": {
          "_id": "68f2d0db280c3dd85fac353f",
          "firstName": "Dr. Sarah",
          "lastName": "Johnson",
          "email": "sarah.johnson@university.edu",
          "role": "mentor"
        },
        "status": "pending",
        "submittedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "role": "student"
        },
        "submittedAt": "2024-01-15T10:30:00Z",
        "reviewedAt": null,
        "reviewedBy": null,
        "reviewNotes": null,
        "approvalDate": null,
        "startDate": null,
        "endDate": null,
        "teamMembers": [
          {
            "userId": {
              "_id": "68f2d0db280c3dd85fac353d",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "role": "student"
            },
            "proposedRole": "Team Leader & AI Developer",
            "skills": ["Python", "Computer Vision", "Robotics", "Machine Learning"],
            "availabilityHoursPerWeek": 20
          },
          {
            "userId": {
              "_id": "68f2d0db280c3dd85fac353e",
              "firstName": "Jane",
              "lastName": "Smith",
              "email": "jane.smith@example.com",
              "role": "student"
            },
            "proposedRole": "Hardware Engineer",
            "skills": ["Arduino", "C++", "Electronics", "Sensor Integration"],
            "availabilityHoursPerWeek": 18
          }
        ],
        "resources": [
          {
            "resourceType": "equipment",
            "description": "Robotics development kit with sensors",
            "estimatedCost": 2000,
            "priority": "high"
          },
          {
            "resourceType": "software",
            "description": "Computer vision libraries and AI frameworks",
            "estimatedCost": 500,
            "priority": "medium"
          },
          {
            "resourceType": "funding",
            "description": "Research materials and conference attendance",
            "estimatedCost": 1500,
            "priority": "low"
          }
        ],
        "auditTrail": [
          {
            "action": "created",
            "performedBy": "68f2d0db280c3dd85fac353d",
            "performedAt": "2024-01-15T10:30:00Z",
            "changes": {
              "field": "project_request",
              "oldValue": null,
              "newValue": "Project request created"
            },
            "reason": "Initial project request submission",
            "ipAddress": "192.168.1.100",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "metadata": {
              "timestamp": "2024-01-15T10:30:00Z",
              "version": "1.0"
            }
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

### 2. Get Project Request Details
**Endpoint:** `GET /api/project-requests/:id`

**Access:** Public (optional authentication)

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Example Request:**
```bash
GET /api/project-requests/68f2db7b640a945ff91190df
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "_id": "68f2db7b640a945ff91190df",
      "title": "AI-Powered Robot Navigation System",
      "description": "Develop an autonomous robot navigation system using AI and computer vision for warehouse automation. This project aims to create a comprehensive solution that combines state-of-the-art computer vision techniques with robust path planning algorithms to enable robots to navigate complex environments autonomously.\n\nThe system will utilize:\n- Deep learning models for object detection and recognition\n- SLAM algorithms for simultaneous localization and mapping\n- Real-time sensor fusion from multiple data sources\n- Advanced path planning with dynamic obstacle avoidance\n\nThe project addresses real-world challenges in warehouse automation and logistics, providing a scalable solution that can be adapted to various industrial applications.",
      "objectives": [
        "Implement SLAM (Simultaneous Localization and Mapping) algorithm",
        "Create obstacle avoidance system using computer vision",
        "Develop path planning algorithm for optimal route calculation",
        "Integrate real-time sensor fusion for accurate positioning",
        "Design and implement user interface for robot control",
        "Conduct comprehensive testing in simulated and real environments"
      ],
      "expectedOutcomes": [
        "Fully autonomous robot capable of warehouse navigation",
        "Research paper publication in robotics conference",
        "Open source code repository with comprehensive documentation",
        "Patent application for novel navigation algorithm",
        "Working prototype demonstration",
        "Industry partnership opportunities"
      ],
      "teamSize": 4,
      "estimatedDurationMonths": 6,
      "budgetEstimate": 5000,
      "requiredResources": [
        "Robotics lab access with testing environment",
        "Computer vision cameras and sensors",
        "Development hardware (GPUs for AI training)",
        "Testing environment setup",
        "Research materials and software licenses"
      ],
      "mentorId": {
        "_id": "68f2d0db280c3dd85fac353f",
        "firstName": "Dr. Sarah",
        "lastName": "Johnson",
        "email": "sarah.johnson@university.edu",
        "role": "mentor"
      },
      "status": "pending",
      "submittedBy": {
        "_id": "68f2d0db280c3dd85fac353d",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "student"
      },
      "submittedAt": "2024-01-15T10:30:00Z",
      "reviewedAt": null,
      "reviewedBy": null,
      "reviewNotes": null,
      "approvalDate": null,
      "startDate": null,
      "endDate": null,
      "teamMembers": [
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353d",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "role": "student"
          },
          "proposedRole": "Team Leader & AI Developer",
          "skills": ["Python", "Computer Vision", "Robotics", "Machine Learning", "TensorFlow", "OpenCV"],
          "availabilityHoursPerWeek": 20
        },
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353e",
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane.smith@example.com",
            "role": "student"
          },
          "proposedRole": "Hardware Engineer",
          "skills": ["Arduino", "C++", "Electronics", "Sensor Integration", "Raspberry Pi"],
          "availabilityHoursPerWeek": 18
        },
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353g",
            "firstName": "Mike",
            "lastName": "Wilson",
            "email": "mike.wilson@example.com",
            "role": "student"
          },
          "proposedRole": "Software Developer",
          "skills": ["JavaScript", "React", "Node.js", "Database Design", "API Development"],
          "availabilityHoursPerWeek": 15
        }
      ],
      "resources": [
        {
          "resourceType": "equipment",
          "description": "Robotics development kit with sensors and actuators",
          "estimatedCost": 2000,
          "priority": "high"
        },
        {
          "resourceType": "software",
          "description": "Computer vision libraries, AI frameworks, and development tools",
          "estimatedCost": 500,
          "priority": "medium"
        },
        {
          "resourceType": "funding",
          "description": "Research materials, conference attendance, and publication costs",
          "estimatedCost": 1500,
          "priority": "low"
        },
        {
          "resourceType": "space",
          "description": "Dedicated lab space for robot testing and development",
          "estimatedCost": 0,
          "priority": "high"
        }
      ],
      "auditTrail": [
        {
          "action": "created",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T10:30:00Z",
          "changes": {
            "field": "project_request",
            "oldValue": null,
            "newValue": "Project request created"
          },
          "reason": "Initial project request submission",
          "ipAddress": "192.168.1.100",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "metadata": {
            "timestamp": "2024-01-15T10:30:00Z",
            "version": "1.0"
          }
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3. Get My Project Requests
**Endpoint:** `GET /api/project-requests/my-requests`

**Access:** Private (Authenticated users only)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status - `pending`, `under_review`, `approved`, `rejected`, `on_hold`
- `limit` (optional): 1-100, default: 20
- `skip` (optional): Default: 0

**Example Request:**
```bash
GET /api/project-requests/my-requests?status=pending&limit=10&skip=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "68f2db7b640a945ff91190df",
        "title": "AI-Powered Robot Navigation System",
        "description": "Develop an autonomous robot navigation system using AI and computer vision for warehouse automation",
        "status": "pending",
        "submittedAt": "2024-01-15T10:30:00Z",
        "mentorId": {
          "_id": "68f2d0db280c3dd85fac353f",
          "firstName": "Dr. Sarah",
          "lastName": "Johnson",
          "email": "sarah.johnson@university.edu",
          "role": "mentor"
        },
        "teamMembers": [
          {
            "userId": {
              "_id": "68f2d0db280c3dd85fac353d",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "role": "student"
            },
            "proposedRole": "Team Leader & AI Developer",
            "skills": ["Python", "Computer Vision", "Robotics", "Machine Learning"],
            "availabilityHoursPerWeek": 20
          },
          {
            "userId": {
              "_id": "68f2d0db280c3dd85fac353e",
              "firstName": "Jane",
              "lastName": "Smith",
              "email": "jane.smith@example.com",
              "role": "student"
            },
            "proposedRole": "Hardware Engineer",
            "skills": ["Arduino", "C++", "Electronics", "Sensor Integration"],
            "availabilityHoursPerWeek": 18
          }
        ],
        "budgetEstimate": 5000,
        "estimatedDurationMonths": 6,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      },
      {
        "_id": "68f2db7b640a945ff91190e0",
        "title": "Smart Agriculture Monitoring System",
        "description": "Develop an IoT-based system for monitoring soil conditions, weather, and crop health",
        "status": "under_review",
        "submittedAt": "2024-01-10T14:20:00Z",
        "mentorId": {
          "_id": "68f2d0db280c3dd85fac353h",
          "firstName": "Dr. Michael",
          "lastName": "Brown",
          "email": "michael.brown@university.edu",
          "role": "mentor"
        },
        "teamMembers": [
          {
            "userId": {
              "_id": "68f2d0db280c3dd85fac353d",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "role": "student"
            },
            "proposedRole": "Project Lead",
            "skills": ["IoT", "Arduino", "Project Management"],
            "availabilityHoursPerWeek": 25
          }
        ],
        "budgetEstimate": 3000,
        "estimatedDurationMonths": 4,
        "createdAt": "2024-01-10T14:20:00Z",
        "updatedAt": "2024-01-12T09:15:00Z"
      }
    ],
    "pagination": {
      "total": 3,
      "limit": 10,
      "skip": 0,
      "hasMore": false
    }
  }
}
```

### 4. Create Project Request
**Endpoint:** `POST /api/project-requests`

**Access:** Private (Any authenticated user)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Smart Home Automation System with AI",
  "description": "Develop an advanced IoT-based smart home automation system with AI-powered learning capabilities, mobile app control, and voice commands. The system will learn user preferences over time and automatically adjust home settings for optimal comfort and energy efficiency.\n\nKey Features:\n- AI-powered learning of user behavior patterns\n- Voice control integration with popular assistants\n- Mobile app with intuitive interface\n- Energy monitoring and optimization\n- Security system integration\n- Remote monitoring and control\n\nThe project will utilize machine learning algorithms to predict user preferences and automate routine tasks, making homes more intelligent and efficient.",
  "objectives": [
    "Design and implement IoT sensor network for comprehensive home monitoring",
    "Develop AI-powered learning system for user behavior analysis",
    "Create intuitive mobile application with real-time control",
    "Implement voice control integration with Alexa and Google Assistant",
    "Build energy monitoring and optimization system",
    "Integrate security features with motion detection and alerts",
    "Develop web dashboard for advanced configuration and monitoring"
  ],
  "expectedOutcomes": [
    "Working smart home prototype with AI capabilities",
    "Mobile app published on iOS and Android app stores",
    "Comprehensive technical documentation and user guide",
    "Research paper on AI-powered home automation",
    "Open source components for community contribution",
    "Industry partnership opportunities for commercialization"
  ],
  "teamSize": 5,
  "estimatedDurationMonths": 8,
  "budgetEstimate": 7500,
  "requiredResources": [
    "Arduino and Raspberry Pi development boards",
    "Various sensors (temperature, humidity, motion, light)",
    "Mobile app development tools and licenses",
    "Cloud computing resources for AI training",
    "Voice assistant development kits",
    "Testing environment setup"
  ],
  "teamMembers": [
    {
      "userId": "68f2d0db280c3dd85fac353d",
      "proposedRole": "Project Lead & AI Developer",
      "skills": ["Machine Learning", "Python", "IoT", "Project Management", "TensorFlow"],
      "availabilityHoursPerWeek": 25
    },
    {
      "userId": "68f2d0db280c3dd85fac353e",
      "proposedRole": "Mobile App Developer",
      "skills": ["React Native", "JavaScript", "iOS Development", "Android Development"],
      "availabilityHoursPerWeek": 20
    },
    {
      "userId": "68f2d0db280c3dd85fac353g",
      "proposedRole": "Hardware Engineer",
      "skills": ["Arduino", "Raspberry Pi", "Electronics", "Sensor Integration", "C++"],
      "availabilityHoursPerWeek": 18
    }
  ],
  "resources": [
    {
      "resourceType": "equipment",
      "description": "Arduino and Raspberry Pi development kits with sensors",
      "estimatedCost": 1500,
      "priority": "high"
    },
    {
      "resourceType": "software",
      "description": "Mobile app development licenses and cloud computing resources",
      "estimatedCost": 2000,
      "priority": "high"
    },
    {
      "resourceType": "funding",
      "description": "Research materials, conference attendance, and publication costs",
      "estimatedCost": 3000,
      "priority": "medium"
    },
    {
      "resourceType": "space",
      "description": "Dedicated lab space for hardware testing and development",
      "estimatedCost": 0,
      "priority": "high"
    },
    {
      "resourceType": "other",
      "description": "Voice assistant development kits and testing equipment",
      "estimatedCost": 1000,
      "priority": "medium"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project request created",
  "data": {
    "item": {
      "_id": "68f2db7b640a945ff91190e1",
      "title": "Smart Home Automation System with AI",
      "description": "Develop an advanced IoT-based smart home automation system with AI-powered learning capabilities, mobile app control, and voice commands. The system will learn user preferences over time and automatically adjust home settings for optimal comfort and energy efficiency.\n\nKey Features:\n- AI-powered learning of user behavior patterns\n- Voice control integration with popular assistants\n- Mobile app with intuitive interface\n- Energy monitoring and optimization\n- Security system integration\n- Remote monitoring and control\n\nThe project will utilize machine learning algorithms to predict user preferences and automate routine tasks, making homes more intelligent and efficient.",
      "objectives": [
        "Design and implement IoT sensor network for comprehensive home monitoring",
        "Develop AI-powered learning system for user behavior analysis",
        "Create intuitive mobile application with real-time control",
        "Implement voice control integration with Alexa and Google Assistant",
        "Build energy monitoring and optimization system",
        "Integrate security features with motion detection and alerts",
        "Develop web dashboard for advanced configuration and monitoring"
      ],
      "expectedOutcomes": [
        "Working smart home prototype with AI capabilities",
        "Mobile app published on iOS and Android app stores",
        "Comprehensive technical documentation and user guide",
        "Research paper on AI-powered home automation",
        "Open source components for community contribution",
        "Industry partnership opportunities for commercialization"
      ],
      "teamSize": 5,
      "estimatedDurationMonths": 8,
      "budgetEstimate": 7500,
      "requiredResources": [
        "Arduino and Raspberry Pi development boards",
        "Various sensors (temperature, humidity, motion, light)",
        "Mobile app development tools and licenses",
        "Cloud computing resources for AI training",
        "Voice assistant development kits",
        "Testing environment setup"
      ],
      "status": "pending",
      "submittedBy": "68f2d0db280c3dd85fac353d",
      "submittedAt": "2024-01-15T12:00:00Z",
      "reviewedAt": null,
      "reviewedBy": null,
      "reviewNotes": null,
      "approvalDate": null,
      "startDate": null,
      "endDate": null,
      "teamMembers": [
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353d",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "role": "student"
          },
          "proposedRole": "Project Lead & AI Developer",
          "skills": ["Machine Learning", "Python", "IoT", "Project Management", "TensorFlow"],
          "availabilityHoursPerWeek": 25
        },
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353e",
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane.smith@example.com",
            "role": "student"
          },
          "proposedRole": "Mobile App Developer",
          "skills": ["React Native", "JavaScript", "iOS Development", "Android Development"],
          "availabilityHoursPerWeek": 20
        },
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353g",
            "firstName": "Mike",
            "lastName": "Wilson",
            "email": "mike.wilson@example.com",
            "role": "student"
          },
          "proposedRole": "Hardware Engineer",
          "skills": ["Arduino", "Raspberry Pi", "Electronics", "Sensor Integration", "C++"],
          "availabilityHoursPerWeek": 18
        }
      ],
      "resources": [
        {
          "resourceType": "equipment",
          "description": "Arduino and Raspberry Pi development kits with sensors",
          "estimatedCost": 1500,
          "priority": "high"
        },
        {
          "resourceType": "software",
          "description": "Mobile app development licenses and cloud computing resources",
          "estimatedCost": 2000,
          "priority": "high"
        },
        {
          "resourceType": "funding",
          "description": "Research materials, conference attendance, and publication costs",
          "estimatedCost": 3000,
          "priority": "medium"
        },
        {
          "resourceType": "space",
          "description": "Dedicated lab space for hardware testing and development",
          "estimatedCost": 0,
          "priority": "high"
        },
        {
          "resourceType": "other",
          "description": "Voice assistant development kits and testing equipment",
          "estimatedCost": 1000,
          "priority": "medium"
        }
      ],
      "auditTrail": [
        {
          "action": "created",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T12:00:00Z",
          "changes": {
            "field": "project_request",
            "oldValue": null,
            "newValue": "Project request created"
          },
          "reason": "Initial project request submission",
          "ipAddress": "192.168.1.100",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "metadata": {
            "timestamp": "2024-01-15T12:00:00Z",
            "version": "1.0"
          }
        }
      ],
      "createdAt": "2024-01-15T12:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

### 5. Update Project Request
**Endpoint:** `PUT /api/project-requests/:id`

**Access:** Private (Owner or Mentor+)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Request Body:**
```json
{
  "title": "Advanced Smart Home Automation System with AI and Machine Learning",
  "description": "Develop an enhanced IoT-based smart home automation system with advanced AI-powered learning capabilities, comprehensive mobile app control, voice commands, and predictive analytics. The system will utilize deep learning algorithms to understand user behavior patterns and automatically optimize home settings for maximum comfort, security, and energy efficiency.\n\nEnhanced Features:\n- Advanced AI-powered learning with deep neural networks\n- Predictive analytics for user behavior forecasting\n- Voice control integration with multiple assistants\n- Advanced mobile app with machine learning insights\n- Comprehensive energy monitoring and optimization\n- Enhanced security system with facial recognition\n- Remote monitoring with real-time alerts and notifications\n- Integration with smart city infrastructure\n\nThe project represents a significant advancement in home automation technology, combining cutting-edge AI research with practical applications for modern living.",
  "budgetEstimate": 10000,
  "estimatedDurationMonths": 10,
  "teamSize": 6,
  "objectives": [
    "Design and implement comprehensive IoT sensor network for complete home monitoring",
    "Develop advanced AI-powered learning system using deep neural networks",
    "Create sophisticated mobile application with machine learning insights",
    "Implement multi-platform voice control integration",
    "Build comprehensive energy monitoring and optimization system",
    "Integrate advanced security features with facial recognition",
    "Develop predictive analytics for user behavior forecasting",
    "Create web dashboard with advanced configuration and monitoring",
    "Implement smart city infrastructure integration",
    "Conduct extensive testing and validation in real-world environments"
  ],
  "expectedOutcomes": [
    "Advanced smart home prototype with cutting-edge AI capabilities",
    "Mobile app published on iOS and Android with machine learning features",
    "Comprehensive technical documentation and research papers",
    "Multiple research publications in AI and IoT conferences",
    "Open source components for community contribution",
    "Industry partnership opportunities for commercialization",
    "Patent applications for novel AI algorithms",
    "Commercial licensing opportunities"
  ],
  "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project request updated",
  "data": {
    "item": {
      "_id": "68f2db7b640a945ff91190e1",
      "title": "Advanced Smart Home Automation System with AI and Machine Learning",
      "description": "Develop an enhanced IoT-based smart home automation system with advanced AI-powered learning capabilities, comprehensive mobile app control, voice commands, and predictive analytics. The system will utilize deep learning algorithms to understand user behavior patterns and automatically optimize home settings for maximum comfort, security, and energy efficiency.\n\nEnhanced Features:\n- Advanced AI-powered learning with deep neural networks\n- Predictive analytics for user behavior forecasting\n- Voice control integration with multiple assistants\n- Advanced mobile app with machine learning insights\n- Comprehensive energy monitoring and optimization\n- Enhanced security system with facial recognition\n- Remote monitoring with real-time alerts and notifications\n- Integration with smart city infrastructure\n\nThe project represents a significant advancement in home automation technology, combining cutting-edge AI research with practical applications for modern living.",
      "budgetEstimate": 10000,
      "estimatedDurationMonths": 10,
      "teamSize": 6,
      "objectives": [
        "Design and implement comprehensive IoT sensor network for complete home monitoring",
        "Develop advanced AI-powered learning system using deep neural networks",
        "Create sophisticated mobile application with machine learning insights",
        "Implement multi-platform voice control integration",
        "Build comprehensive energy monitoring and optimization system",
        "Integrate advanced security features with facial recognition",
        "Develop predictive analytics for user behavior forecasting",
        "Create web dashboard with advanced configuration and monitoring",
        "Implement smart city infrastructure integration",
        "Conduct extensive testing and validation in real-world environments"
      ],
      "expectedOutcomes": [
        "Advanced smart home prototype with cutting-edge AI capabilities",
        "Mobile app published on iOS and Android with machine learning features",
        "Comprehensive technical documentation and research papers",
        "Multiple research publications in AI and IoT conferences",
        "Open source components for community contribution",
        "Industry partnership opportunities for commercialization",
        "Patent applications for novel AI algorithms",
        "Commercial licensing opportunities"
      ],
      "auditTrail": [
        {
          "action": "created",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T12:00:00Z",
          "changes": {
            "field": "project_request",
            "oldValue": null,
            "newValue": "Project request created"
          },
          "reason": "Initial project request submission",
          "ipAddress": "192.168.1.100",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "metadata": {
            "timestamp": "2024-01-15T12:00:00Z",
            "version": "1.0"
          }
        },
        {
          "action": "updated",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T13:30:00Z",
          "changes": {
            "field": "title",
            "oldValue": "Smart Home Automation System with AI",
            "newValue": "Advanced Smart Home Automation System with AI and Machine Learning"
          },
          "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation",
          "ipAddress": "192.168.1.100",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "metadata": {
            "timestamp": "2024-01-15T13:30:00Z",
            "version": "1.0"
          }
        },
        {
          "action": "updated",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T13:30:00Z",
          "changes": {
            "field": "budgetEstimate",
            "oldValue": 7500,
            "newValue": 10000
          },
          "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation",
          "ipAddress": "192.168.1.100",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "metadata": {
            "timestamp": "2024-01-15T13:30:00Z",
            "version": "1.0"
          }
        },
        {
          "action": "updated",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T13:30:00Z",
          "changes": {
            "field": "estimatedDurationMonths",
            "oldValue": 8,
            "newValue": 10
          },
          "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation",
          "ipAddress": "192.168.1.100",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "metadata": {
            "timestamp": "2024-01-15T13:30:00Z",
            "version": "1.0"
          }
        },
        {
          "action": "updated",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T13:30:00Z",
          "changes": {
            "field": "teamSize",
            "oldValue": 5,
            "newValue": 6
          },
          "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation",
          "ipAddress": "192.168.1.100",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "metadata": {
            "timestamp": "2024-01-15T13:30:00Z",
            "version": "1.0"
          }
        }
      ],
      "updatedAt": "2024-01-15T13:30:00Z"
    }
  }
}
```

### 6. Delete Project Request
**Endpoint:** `DELETE /api/project-requests/:id`

**Access:** Private (Owner or Admin)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Request Body:**
```json
{
  "reason": "Project requirements have changed significantly. Will submit a new request with updated specifications."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project request deleted"
}
```

### 7. Approve Project Request (Mentor+ Access)
**Endpoint:** `POST /api/project-requests/:id/approve`

**Access:** Private (Mentor, Researcher, Admin)

**Headers:**
```
Authorization: Bearer <mentor-token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Request Body:**
```json
{
  "reason": "Excellent project proposal with clear objectives and realistic timeline. Team has strong technical skills and the project aligns well with our research goals. Approved for implementation."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request approved",
  "data": {
    "request": {
      "_id": "68f2db7b640a945ff91190e1",
      "title": "Advanced Smart Home Automation System with AI and Machine Learning",
      "status": "approved",
      "approvalDate": "2024-01-16T09:00:00Z",
      "reviewedAt": "2024-01-16T09:00:00Z",
      "reviewedBy": "68f2d0db280c3dd85fac353f",
      "reviewNotes": "Excellent project proposal with clear objectives and realistic timeline. Team has strong technical skills and the project aligns well with our research goals. Approved for implementation.",
      "auditTrail": [
        {
          "action": "created",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T12:00:00Z",
          "changes": {
            "field": "project_request",
            "oldValue": null,
            "newValue": "Project request created"
          },
          "reason": "Initial project request submission"
        },
        {
          "action": "updated",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T13:30:00Z",
          "changes": {
            "field": "title",
            "oldValue": "Smart Home Automation System with AI",
            "newValue": "Advanced Smart Home Automation System with AI and Machine Learning"
          },
          "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation"
        },
        {
          "action": "approved",
          "performedBy": "68f2d0db280c3dd85fac353f",
          "performedAt": "2024-01-16T09:00:00Z",
          "changes": {
            "field": "status",
            "oldValue": "pending",
            "newValue": "approved"
          },
          "reason": "Excellent project proposal with clear objectives and realistic timeline. Team has strong technical skills and the project aligns well with our research goals. Approved for implementation.",
          "ipAddress": "192.168.1.200",
          "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "metadata": {
            "timestamp": "2024-01-16T09:00:00Z",
            "version": "1.0"
          }
        }
      ],
      "updatedAt": "2024-01-16T09:00:00Z"
    }
  }
}
```

### 8. Reject Project Request (Mentor+ Access)
**Endpoint:** `POST /api/project-requests/:id/reject`

**Access:** Private (Mentor, Researcher, Admin)

**Headers:**
```
Authorization: Bearer <mentor-token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Request Body:**
```json
{
  "reason": "Project scope is too broad for current resources and timeline. The proposed budget exceeds available funding. Please revise the proposal with more focused objectives and realistic budget constraints."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request rejected",
  "data": {
    "request": {
      "_id": "68f2db7b640a945ff91190e1",
      "title": "Advanced Smart Home Automation System with AI and Machine Learning",
      "status": "rejected",
      "reviewedAt": "2024-01-16T10:30:00Z",
      "reviewedBy": "68f2d0db280c3dd85fac353f",
      "reviewNotes": "Project scope is too broad for current resources and timeline. The proposed budget exceeds available funding. Please revise the proposal with more focused objectives and realistic budget constraints.",
      "auditTrail": [
        {
          "action": "created",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T12:00:00Z",
          "changes": {
            "field": "project_request",
            "oldValue": null,
            "newValue": "Project request created"
          },
          "reason": "Initial project request submission"
        },
        {
          "action": "updated",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T13:30:00Z",
          "changes": {
            "field": "title",
            "oldValue": "Smart Home Automation System with AI",
            "newValue": "Advanced Smart Home Automation System with AI and Machine Learning"
          },
          "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation"
        },
        {
          "action": "rejected",
          "performedBy": "68f2d0db280c3dd85fac353f",
          "performedAt": "2024-01-16T10:30:00Z",
          "changes": {
            "field": "status",
            "oldValue": "pending",
            "newValue": "rejected"
          },
          "reason": "Project scope is too broad for current resources and timeline. The proposed budget exceeds available funding. Please revise the proposal with more focused objectives and realistic budget constraints.",
          "ipAddress": "192.168.1.200",
          "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "metadata": {
            "timestamp": "2024-01-16T10:30:00Z",
            "version": "1.0"
          }
        }
      ],
      "updatedAt": "2024-01-16T10:30:00Z"
    }
  }
}
```

### 9. Get Project Request Audit Trail
**Endpoint:** `GET /api/project-requests/:id/audit-trail`

**Access:** Private (Owner or Admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Response:**
```json
{
  "success": true,
  "data": {
    "projectRequestId": "68f2db7b640a945ff91190e1",
    "projectTitle": "Advanced Smart Home Automation System with AI and Machine Learning",
    "auditTrail": [
      {
        "action": "rejected",
        "performedBy": {
          "_id": "68f2d0db280c3dd85fac353f",
          "firstName": "Dr. Sarah",
          "lastName": "Johnson",
          "email": "sarah.johnson@university.edu",
          "role": "mentor"
        },
        "performedAt": "2024-01-16T10:30:00Z",
        "changes": {
          "field": "status",
          "oldValue": "pending",
          "newValue": "rejected"
        },
        "reason": "Project scope is too broad for current resources and timeline. The proposed budget exceeds available funding. Please revise the proposal with more focused objectives and realistic budget constraints.",
        "ipAddress": "192.168.1.200",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "metadata": {
          "timestamp": "2024-01-16T10:30:00Z",
          "version": "1.0"
        }
      },
      {
        "action": "updated",
        "performedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "role": "student"
        },
        "performedAt": "2024-01-15T13:30:00Z",
        "changes": {
          "field": "teamSize",
          "oldValue": 5,
          "newValue": 6
        },
        "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "metadata": {
          "timestamp": "2024-01-15T13:30:00Z",
          "version": "1.0"
        }
      },
      {
        "action": "updated",
        "performedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "role": "student"
        },
        "performedAt": "2024-01-15T13:30:00Z",
        "changes": {
          "field": "budgetEstimate",
          "oldValue": 7500,
          "newValue": 10000
        },
        "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "metadata": {
          "timestamp": "2024-01-15T13:30:00Z",
          "version": "1.0"
        }
      },
      {
        "action": "updated",
        "performedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "role": "student"
        },
        "performedAt": "2024-01-15T13:30:00Z",
        "changes": {
          "field": "title",
          "oldValue": "Smart Home Automation System with AI",
          "newValue": "Advanced Smart Home Automation System with AI and Machine Learning"
        },
        "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "metadata": {
          "timestamp": "2024-01-15T13:30:00Z",
          "version": "1.0"
        }
      },
      {
        "action": "created",
        "performedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "role": "student"
        },
        "performedAt": "2024-01-15T12:00:00Z",
        "changes": {
          "field": "project_request",
          "oldValue": null,
          "newValue": "Project request created"
        },
        "reason": "Initial project request submission",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "metadata": {
          "timestamp": "2024-01-15T12:00:00Z",
          "version": "1.0"
        }
      }
    ]
  }
}
```

### 10. Get All Audit Trails (Admin Only)
**Endpoint:** `GET /api/project-requests/audit-trails/all`

**Access:** Private (Admin Only)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `limit` (optional): 1-100, default: 50
- `skip` (optional): Default: 0

**Example Request:**
```bash
GET /api/project-requests/audit-trails/all?limit=20&skip=0
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectRequests": [
      {
        "_id": "68f2db7b640a945ff91190e1",
        "title": "Advanced Smart Home Automation System with AI and Machine Learning",
        "submittedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com"
        },
        "auditTrail": [
          {
            "action": "rejected",
            "performedBy": {
              "_id": "68f2d0db280c3dd85fac353f",
              "firstName": "Dr. Sarah",
              "lastName": "Johnson",
              "email": "sarah.johnson@university.edu",
              "role": "mentor"
            },
            "performedAt": "2024-01-16T10:30:00Z",
            "changes": {
              "field": "status",
              "oldValue": "pending",
              "newValue": "rejected"
            },
            "reason": "Project scope is too broad for current resources and timeline. The proposed budget exceeds available funding. Please revise the proposal with more focused objectives and realistic budget constraints."
          },
          {
            "action": "updated",
            "performedBy": {
              "_id": "68f2d0db280c3dd85fac353d",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "role": "student"
            },
            "performedAt": "2024-01-15T13:30:00Z",
            "changes": {
              "field": "budgetEstimate",
              "oldValue": 7500,
              "newValue": 10000
            },
            "reason": "Expanded project scope to include advanced AI features and increased team size for better implementation"
          },
          {
            "action": "created",
            "performedBy": {
              "_id": "68f2d0db280c3dd85fac353d",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "role": "student"
            },
            "performedAt": "2024-01-15T12:00:00Z",
            "changes": {
              "field": "project_request",
              "oldValue": null,
              "newValue": "Project request created"
            },
            "reason": "Initial project request submission"
          }
        ]
      },
      {
        "_id": "68f2db7b640a945ff91190df",
        "title": "AI-Powered Robot Navigation System",
        "submittedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com"
        },
        "auditTrail": [
          {
            "action": "created",
            "performedBy": {
              "_id": "68f2d0db280c3dd85fac353d",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "role": "student"
            },
            "performedAt": "2024-01-15T10:30:00Z",
            "changes": {
              "field": "project_request",
              "oldValue": null,
              "newValue": "Project request created"
            },
            "reason": "Initial project request submission"
          }
        ]
      }
    ],
    "pagination": {
      "limit": 20,
      "skip": 0
    }
  }
}
```

---

## 🔍 Error Responses

### Common Error Formats

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title must be between 5 and 255 characters"
      },
      {
        "field": "description",
        "message": "Description must be between 20 and 5000 characters"
      },
      {
        "field": "teamSize",
        "message": "Team size must be between 1 and 20"
      }
    ],
    "code": "VALIDATION_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "AUTHENTICATION_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Authorization Error (403):**
```json
{
  "success": false,
  "error": {
    "message": "Access denied. You can only update your own project requests or need mentor+ privileges",
    "code": "AUTHORIZATION_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "error": {
    "message": "ProjectRequest not found",
    "code": "NOT_FOUND_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Conflict Error (409):**
```json
{
  "success": false,
  "error": {
    "message": "Cannot update approved project requests",
    "code": "CONFLICT_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

---

## 📝 Project Request Data Model

### Complete Schema Structure
```json
{
  "_id": "ObjectId",
  "title": "String (5-255 chars, required)",
  "description": "String (20-5000 chars, required)",
  "objectives": ["String (max 500 chars each)"],
  "expectedOutcomes": ["String (max 500 chars each)"],
  "teamSize": "Number (1-20, required)",
  "estimatedDurationMonths": "Number (1-24, required)",
  "budgetEstimate": "Number (min 0)",
  "requiredResources": ["String (max 200 chars each)"],
  "mentorId": "ObjectId (ref: User)",
  "status": "String (enum: pending, under_review, approved, rejected, on_hold)",
  "submittedBy": "ObjectId (ref: User, required)",
  "submittedAt": "Date (default: now)",
  "reviewedAt": "Date",
  "reviewedBy": "ObjectId (ref: User)",
  "reviewNotes": "String (max 2000 chars)",
  "approvalDate": "Date",
  "startDate": "Date",
  "endDate": "Date",
  "teamMembers": [
    {
      "userId": "ObjectId (ref: User, required)",
      "proposedRole": "String (max 100 chars, required)",
      "skills": ["String (max 100 chars each)"],
      "availabilityHoursPerWeek": "Number (1-40)"
    }
  ],
  "resources": [
    {
      "resourceType": "String (enum: equipment, software, funding, space, other)",
      "description": "String (max 500 chars, required)",
      "estimatedCost": "Number (min 0)",
      "priority": "String (enum: low, medium, high, critical, default: medium)"
    }
  ],
  "auditTrail": [
    {
      "action": "String (enum: created, updated, approved, rejected, status_changed, deleted)",
      "performedBy": "ObjectId (ref: User, required)",
      "performedAt": "Date (default: now)",
      "changes": {
        "field": "String (required)",
        "oldValue": "Mixed",
        "newValue": "Mixed"
      },
      "reason": "String (max 500 chars)",
      "ipAddress": "String",
      "userAgent": "String",
      "metadata": "Mixed"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 🎯 Key Features

### **Comprehensive Audit Trail**
- ✅ **Complete Change Tracking** - Every modification is logged with full details
- ✅ **User Accountability** - Know exactly who made what changes and when
- ✅ **IP and User Agent Logging** - Track where changes originated from
- ✅ **Reason Tracking** - Optional reason field for all changes
- ✅ **Metadata Support** - Additional context for audit entries

### **Role-Based Access Control**
- ✅ **Public Access** - Anyone can view project requests
- ✅ **Authenticated Creation** - Any authenticated user can create requests
- ✅ **Owner Updates** - Users can update their own requests (with restrictions)
- ✅ **Mentor+ Approval** - Mentors, researchers, and admins can approve/reject
- ✅ **Admin Management** - Admins have full access to all operations

### **Status-Based Restrictions**
- ✅ **Pending** - Can be updated by owner
- ✅ **Under Review** - Limited updates allowed
- ✅ **Approved** - Cannot be updated by owner (mentor+ only)
- ✅ **Rejected** - Cannot be updated by owner (create new request)
- ✅ **On Hold** - Temporary suspension

### **Advanced Features**
- ✅ **Soft Delete** - Requests are marked as deleted, not removed
- ✅ **Email Notifications** - Automatic notifications for status changes
- ✅ **Comprehensive Filtering** - Multiple ways to filter and search
- ✅ **Pagination Support** - Efficient handling of large datasets
- ✅ **Validation** - Comprehensive input validation and error handling

This documentation provides everything needed to implement a complete project request system with full audit trail capabilities! 🚀

