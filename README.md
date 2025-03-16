# Eisenhower Matrix

A modern task management application built with React and TypeScript, implementing the Eisenhower Matrix methodology for effective prioritization of tasks.

## 🎯 Features

- **Task Management**: Create, edit, and delete tasks with ease
- **Priority Matrix**: Organize tasks in four quadrants based on urgency and importance
- **Drag and Drop**: Intuitive drag-and-drop interface for task organization
- **Real-time Updates**: Powered by Supabase for real-time data synchronization
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **PWA Support**: Install as a Progressive Web App for offline access

## 🚀 Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Database & Auth**: Supabase
- **Drag and Drop**: Hello Pangea DND
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Form Validation**: Zod
- **Build Tool**: Vite
- **PWA**: Workbox & vite-plugin-pwa

## 📦 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/eisenhower-matrix.git
   cd eisenhower-matrix
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 🚀 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 PWA Support

The application supports Progressive Web App (PWA) functionality, allowing users to:
- Install the app on their devices
- Access the app offline
- Receive push notifications (if implemented)
- Experience native-like functionality

## 🔐 Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Eisenhower Matrix Methodology](https://www.eisenhower.me/eisenhower-matrix/)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/) 