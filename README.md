# TaskFlow Pro 🚀

A complete, production-ready SaaS Task Management Application with modern UI, voice commands, and multi-channel notifications.

![TaskFlow Pro](https://img.shields.io/badge/TaskFlow-Pro-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

## ✨ Features

### 🎨 **Modern UI & UX**
- **Dark/Light/System Themes** - Seamless theme switching with system preference detection
- **Glass Morphism Design** - Modern glass effects with backdrop blur
- **Responsive Design** - Mobile-first approach supporting all device sizes
- **Interactive Animations** - Smooth micro-interactions and hover effects
- **Gradient Backgrounds** - Beautiful gradient meshes and modern styling

### 🎤 **Voice Integration**
- **Voice Task Creation** - Create tasks using voice commands
- **Speech Recognition** - Browser-based speech-to-text functionality
- **Voice Metadata** - Track voice-created tasks with metadata

### 👥 **Stakeholder Management**
- **Contact Import** - Import contacts from device using Web Contacts API
- **vCard Export** - Export stakeholders as vCard files
- **Organization Grouping** - Group stakeholders by organization
- **Tag System** - Flexible tagging for better organization

### 📅 **Task Management**
- **Priority Levels** - Low, Medium, High, Urgent priority system
- **Status Tracking** - Pending, In Progress, Completed, Cancelled, Overdue
- **Due Date Management** - Calendar integration with due date tracking
- **Task Analytics** - Completion rates and performance metrics

### 🔔 **Multi-Channel Notifications**
- **Email Notifications** - Brevo integration (300 emails/day free)
- **SMS Notifications** - Fast2SMS integration with Indian numbers
- **WhatsApp Notifications** - MSG91 WhatsApp Business API
- **Smart Reminders** - Automated reminder system with retry logic

### 🔐 **Authentication & Security**
- **JWT Authentication** - Secure token-based authentication
- **Password Reset** - Email-based password recovery
- **Phone Verification** - SMS-based phone number verification
- **Session Management** - Secure session handling with refresh tokens

### 📊 **Dashboard & Analytics**
- **Real-time Stats** - Task completion rates and metrics
- **Recent Activity** - Latest tasks and updates
- **Upcoming Tasks** - Tasks due in the next 7 days
- **Quick Actions** - Fast access to common operations

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **React Hook Form** - Form handling with validation
- **Lucide React** - Beautiful icon library

### **Backend**
- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **SQLite** - Lightweight database for development
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Class Validator** - DTO validation

### **Notifications**
- **Brevo** - Email service (300 emails/day free)
- **Fast2SMS** - SMS service for India
- **MSG91** - WhatsApp Business API

### **DevOps**
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dinaypatil-web/taskflow-pro.git
   cd taskflow-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```

4. **Set up the database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:backend  # Backend on http://localhost:3002
   npm run dev:frontend # Frontend on http://localhost:3000
   ```

### Demo Credentials
- **Email**: demo@taskflowpro.com
- **Password**: Demo123!

## 📱 Mobile Features

### **Responsive Design**
- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes
- Optimized performance on mobile devices

### **Contact Integration**
- Import contacts from device
- Export stakeholders to contacts
- vCard file generation for manual import
- Privacy-focused with user consent

### **Progressive Web App (PWA) Ready**
- Offline capability
- App-like experience
- Push notifications support
- Install prompt for mobile devices

## 🔧 Configuration

### **API Services Setup**

1. **Brevo (Email)**
   - Sign up at [brevo.com](https://brevo.com)
   - Get API key from account settings
   - Add to `BREVO_API_KEY` in backend/.env

2. **Fast2SMS (SMS)**
   - Sign up at [fast2sms.com](https://fast2sms.com)
   - Get API key and sender ID
   - Add to `FAST2SMS_API_KEY` in backend/.env

3. **MSG91 (WhatsApp)**
   - Sign up at [msg91.com](https://msg91.com)
   - Get WhatsApp API credentials
   - Add to `MSG91_*` variables in backend/.env

### **Database Configuration**
- Development: SQLite (included)
- Production: PostgreSQL recommended
- Update `DATABASE_URL` in backend/.env

## 🐳 Docker Deployment

### **Development**
```bash
docker-compose up -d
```

### **Production**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Documentation

- [API Documentation](docs/api.md) - Complete API reference
- [Deployment Guide](docs/deployment.md) - Production deployment
- [Mobile Integration](docs/mobile-contacts-integration.md) - Contact features
- [Theme System](docs/theme-system.md) - Theme customization
- [API Setup Guide](docs/api-setup-guide.md) - Third-party services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [NestJS](https://nestjs.com/) - Progressive Node.js Framework
- [Prisma](https://prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide](https://lucide.dev/) - Beautiful icons

## 📞 Support

For support, email dinaypatil.web@gmail.com or create an issue on GitHub.

---

**Built with ❤️ by [Dinay Patil](https://github.com/dinaypatil-web)**