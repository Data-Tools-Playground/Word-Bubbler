# Word Bubbler 💭

A dynamic, real-time word cloud visualization app that transforms text responses into beautiful, animated word clouds. Built with Next.js, TypeScript, and D3.js.

## ✨ Features

### Core Functionality
- **Real-time Word Cloud**: Dynamic visualization that updates instantly as new responses are added
- **Interactive Text Input**: Clean, responsive form for collecting user feedback
- **Smart Text Processing**: Automatic filtering of stop words and intelligent word frequency calculation
- **Live Statistics**: Real-time counters for responses, unique words, and total word count
- **Demo Data**: Built-in sample data to quickly test the visualization

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

### Basic Usage
1. **Submit Responses**: Use the text input to submit your thoughts or feedback
2. **Watch the Cloud**: See words appear and grow in the real-time word cloud
3. **Demo Mode**: Click "Load Demo Data" to see the app in action with sample responses
4. **Interactive Exploration**: Hover over words in the cloud for visual feedback

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