import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CivicBetter Admin API',
      version: '1.0.0',
      description: 'API documentation for CivicBetter Admin backend',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password', 'role'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123',
            },
            role: {
              type: 'string',
              enum: ['citizen', 'worker', 'admin'],
              example: 'citizen',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name', 'role'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'password123',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['citizen', 'worker', 'admin'],
              example: 'citizen',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token',
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string', enum: ['citizen', 'worker', 'admin'] },
                name: { type: 'string' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['citizen', 'worker', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserListResponse: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
        CreateIssueRequest: {
          type: 'object',
          required: ['title', 'description', 'category', 'location'],
          properties: {
            title: {
              type: 'string',
              example: 'Pothole on Main Street',
            },
            description: {
              type: 'string',
              example: 'Large pothole causing traffic issues',
            },
            category: {
              type: 'string',
              example: 'infrastructure',
            },
            location: {
              type: 'string',
              example: '123 Main St, City, State',
            },
            photo: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'URL to issue photo',
            },
          },
        },
        EditIssueRequest: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            location: { type: 'string' },
            photo: { type: 'string', format: 'uri', nullable: true },
            status: {
              type: 'string',
              enum: ['pending', 'assigned', 'accepted', 'in-progress', 'completed', 'rejected'],
            },
            assignedTo: { type: 'string', nullable: true },
          },
        },
        Issue: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            location: { type: 'string' },
            photo: { type: 'string', format: 'uri', nullable: true },
            status: {
              type: 'string',
              enum: ['pending', 'assigned', 'accepted', 'in-progress', 'completed', 'rejected'],
            },
            createdBy: { type: 'string' },
            assignedTo: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        IssueListResponse: {
          type: 'object',
          properties: {
            issues: {
              type: 'array',
              items: { $ref: '#/components/schemas/Issue' },
            },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
        UploadImageResponse: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              description: 'Public URL of uploaded image',
            },
            path: {
              type: 'string',
              description: 'Storage path of uploaded image',
            },
          },
        },
        UploadMultipleImagesResponse: {
          type: 'object',
          properties: {
            uploads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string', format: 'uri' },
                  path: { type: 'string' },
                  error: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        Worker: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            description: { type: 'string', nullable: true },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specialization tags',
            },
            location: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['available', 'busy', 'offline', 'on_leave'],
            },
            type: {
              type: 'string',
              enum: ['individual', 'organization'],
            },
            organizationName: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            upiId: {
              type: 'string',
              nullable: true,
              description: 'UPI ID for payments (e.g., 9876543210@paytm)',
            },
            bankAccount: { type: 'string', nullable: true },
            panCard: { type: 'string', nullable: true },
            rating: { type: 'number', nullable: true },
            totalJobs: { type: 'number' },
            totalEarnings: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string', enum: ['citizen', 'worker', 'admin'] },
              },
            },
            assignedIssues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        WorkerListResponse: {
          type: 'object',
          properties: {
            workers: {
              type: 'array',
              items: { $ref: '#/components/schemas/Worker' },
            },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
        UpdateWorkerRequest: {
          type: 'object',
          properties: {
            description: { type: 'string', nullable: true },
            tags: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
            },
            location: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['available', 'busy', 'offline', 'on_leave'],
              nullable: true,
            },
            phone: { type: 'string', nullable: true },
            organizationName: { type: 'string', nullable: true },
            type: {
              type: 'string',
              enum: ['individual', 'organization'],
              nullable: true,
            },
            upiId: {
              type: 'string',
              nullable: true,
              description: 'UPI ID (e.g., 9876543210@paytm)',
            },
            bankAccount: { type: 'string', nullable: true },
            panCard: { type: 'string', nullable: true },
          },
        },
        AssignWorkerRequest: {
          type: 'object',
          required: ['issueId'],
          properties: {
            issueId: {
              type: 'string',
              description: 'Issue ID to assign to worker',
            },
          },
        },
        AutoAssignRequest: {
          type: 'object',
          required: ['issueId'],
          properties: {
            issueId: {
              type: 'string',
              description: 'Issue ID to auto-assign',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

