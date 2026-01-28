# tasq.one

A modern, intuitive task management application built with React, TypeScript, and Vite. Organize your life, one task at a time.

## 🚀 Features

### Core Functionality
- **Task Management** - Create, organize, and track tasks with ease
- **Project Organization** - Group related tasks into projects
- **Google Authentication** - Secure login with Google OAuth
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Real-time Updates** - Live task status and progress tracking

### Advanced Features
- **Smart Notifications** - Deadline reminders and upcoming task alerts
- **Calendar Integration** - Visual schedule planning
- **Workflow Visualization** - Track task progress through different stages
- **Workspace Intelligence** - AI-powered task suggestions and insights
- **Brainstorming Tools** - Creative task ideation and planning

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Authentication**: Google OAuth 2.0
- **State Management**: React Hooks

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google OAuth credentials (for authentication)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/studiorevonza/Task.One.git
   cd Task.One
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   VITE_GOOGLE_REDIRECT_URI=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## 🔐 Google OAuth Setup

To enable Google authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000` (development)
   - Your production domain (when deployed)
6. Copy the Client ID to your `.env` file

## 📁 Project Structure

```
tasq.one/
├── components/
│   ├── Auth.tsx          # Authentication forms
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── Dashboard.tsx     # Main dashboard
│   ├── TaskManager.tsx   # Task management interface
│   ├── ProjectManager.tsx # Project organization
│   ├── CalendarView.tsx  # Calendar integration
│   ├── WorkflowView.tsx  # Workflow visualization
│   ├── UserProfile.tsx   # User settings
│   └── ...
├── services/
│   └── geminiService.ts  # AI service integration
├── public/
│   └── one.png          # Application logo
├── App.tsx              # Main application component
├── index.html           # HTML template
├── types.ts             # TypeScript interfaces
├── constants.ts         # Application constants
└── ...
```

## 🎨 Key Components

### Authentication (`Auth.tsx`)
- Email/password login
- Google OAuth integration
- Signup and password reset flows
- Responsive form design

### Dashboard (`Dashboard.tsx`)
- Overview of tasks and projects
- Quick statistics and metrics
- Recent activity feed
- Quick action buttons

### Task Manager (`TaskManager.tsx`)
- Create and manage tasks
- Set priorities and deadlines
- Add dependencies between tasks
- Filter and search functionality

### Project Manager (`ProjectManager.tsx`)
- Project creation and organization
- Progress tracking
- Team collaboration features
- Resource allocation

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Netlify
1. Link your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables

### Manual Deployment
1. Build the project: `npm run build`
2. Upload the `dist` folder to your web server
3. Configure your web server for SPA routing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2) - Authentication

## 📞 Support

For support, email support@tasq.one or create an issue in this repository.

---

*Made with ❤️ by Studio Revonza*
