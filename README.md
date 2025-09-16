# Word Bubbler 💭

A dynamic, real-time word cloud visualization app that transforms live text responses into beautiful, animated word clouds. Perfect for live events, workshops, and collaborative polling. Built with Next.js, TypeScript, Socket.IO, and D3.js.

## ✨ Features

### 🎯 Live Polling Mode
- **Multi-user Sessions**: Create shareable poll sessions with unique IDs
- **Real-time Collaboration**: Multiple participants can submit responses simultaneously
- **Live Updates**: Watch the word cloud evolve as responses pour in
- **Session Management**: Copy share links, track participants, and manage sessions
- **WebSocket Technology**: Instant synchronization across all connected users

### 📊 Data Analysis Mode
- **📁 File Upload**: Support for CSV, JSON, and TXT files with automatic parsing
- **📝 Bulk Text Paste**: Copy and paste multiple responses at once
- **🎯 Demo Data**: Built-in sample data to quickly test the visualization
- **Offline Analysis**: Analyze existing survey data without live collaboration

### Core Functionality
- **Smart Text Processing**: Automatic filtering of stop words and intelligent word frequency calculation
- **Live Statistics**: Real-time counters for responses, unique words, and participant count
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Session URLs**: Shareable links for easy participant access

### Visualization Features
- **D3.js Powered**: Smooth animations and professional-quality word clouds
- **Frequency-based Sizing**: Words scale proportionally to their frequency
- **Color-coded Display**: Attractive color scheme with hover effects
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### User Experience
- **Recent Responses**: Shows the latest submissions for transparency
- **Click Interactions**: Interactive word cloud elements with hover effects
- **Modern UI**: Clean, professional interface built with Tailwind CSS
- **TypeScript**: Full type safety for robust development

## 🚀 Live Demo

Visit the live application: [Word Bubbler](https://data-tools-playground.github.io/Word-Bubbler/)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: D3.js and d3-cloud
- **Deployment**: GitHub Pages
- **Development**: Turbopack for fast builds

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Data-Tools-Playground/Word-Bubbler.git
   cd Word-Bubbler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` (or `http://localhost:3002` if 3000 is in use)

## 🎯 Usage

### Getting Started
1. **Choose Your Input Method**:
   - **📁 Upload File**: Drag and drop CSV, JSON, or TXT files
   - **📝 Paste Text**: Copy multiple responses from anywhere
   - **✏️ Manual Entry**: Type responses individually or use demo data

2. **Watch the Magic**: See your word cloud generate instantly with frequency-based sizing

3. **Interact**: Hover over words, view statistics, and add more data as needed

### Supported File Formats
- **CSV**: Columns with headers like "response", "text", "comment", or "feedback"
- **JSON**: Array of objects with text fields or simple string array
- **TXT**: One response per line

### Use Cases
- **Public Consultations**: Gather and visualize community feedback in real-time
- **Workshop Facilitation**: Engage participants and surface key themes during sessions
- **Survey Analysis**: Transform open-ended responses into visual insights
- **Brainstorming Sessions**: Capture and display ideas as they emerge
- **Educational Settings**: Interactive classroom activities and discussion visualization

## 🚀 Deployment

### GitHub Pages (Automatic)
This repository is configured for automatic deployment to GitHub Pages:
1. Push to the `main` branch
2. GitHub Actions automatically builds and deploys
3. Site is available at: https://data-tools-playground.github.io/Word-Bubbler/

**Note**: The repository must be public for GitHub Pages to work.

## 🎨 Customization

### Styling
- Modify Tailwind classes in components for custom styling
- Update color schemes in `WordCloud.tsx` for different visual themes
- Customize layout in `app/page.tsx`

### Text Processing
- Add/remove stop words in `textProcessor.ts`
- Adjust word frequency algorithms
- Customize filtering logic

## 🔮 Future Enhancements

### Planned Features
- **Multi-user Real-time**: WebSocket integration for live collaboration
- **Sentiment Analysis**: Color-code words by emotional tone
- **Export Options**: Download word clouds as images or data
- **Advanced Analytics**: Timeline view, trend analysis, and clustering
- **SMS Integration**: Collect responses via text messages
- **Moderation Tools**: Admin interface for content management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Word cloud visualization powered by [D3.js](https://d3js.org/) and [d3-cloud](https://github.com/jasondavies/d3-cloud)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Happy word clouding!** 🎉