# Word Bubbler 💭 - "One Phone, One Voice"

**Real-time SMS polling that turns open-text into animated word clouds with advanced analytics, persistent participant intelligence, and comprehensive moderator tools.**

## 🎯 Product Vision

Transform live text responses into **animated word clouds** with:
- **Frequency/Timeline Analysis** - Track word evolution over time
- **Sentiment & Emotion Mapping** - Plutchik's Wheel implementation
- **Right-click Filtering** - AND/OR boolean logic with visual UI
- **Moderator Curation** - Delete/merge/glossary with undo/redo
- **Respondent Clustering** - HDBSCAN/KMeans participant grouping
- **Persistent Profiles** - Phone number-based longitudinal tracking
- **Rate-limit Controls** - Spam prevention and throttling
- **Demographic Enrichment** - Age, gender, location, occupation data
- **Geographic Mapping** - Regional sentiment and cloud overlays
- **AI Insights Dashboard** - Convergence/divergence, opinion leaders

## ✨ Current Features (MVP+)

### 🎯 **Real-time Collaborative Polling**
- Session-based participation with unique session IDs
- Live word cloud visualization using D3.js with hover effects
- WebSocket real-time updates across all connected users
- Dual operation modes: Live polling + offline data analysis

### 📱 **SMS Integration with Profile Building**
- Twilio-powered SMS participation (`JOIN <session-id>`)
- Automatic profile creation for each phone number
- Persistent participant tracking across multiple sessions
- SMS command processing (JOIN, LEAVE, HELP, STOP)
- Real-time SMS stats and invite management

### 👥 **Profile Building & Evolution System**
- **Persistent Profiles**: Phone number-based participant intelligence
- **Longitudinal Tracking**: Engagement patterns across sessions
- **Tagging System**: Manual and automatic classification
- **Opinion Leader Identification**: Influence scoring and consistency metrics
- **Profile Management Dashboard**: Search, filter, and analyze participants
- **Export Capabilities**: Segment-tagged contact lists

### 📊 **Analytics & Insights**
- Response volume metrics and engagement tracking
- Sentiment analysis with trend visualization
- Profile-based filtering and segmentation
- Recent submissions display with statistics
- File upload support for CSV/text data analysis

### 🎨 **Enhanced User Experience**
- Responsive design with Tailwind CSS
- Multiple input methods (web forms, SMS, file upload)
- Demo data feature for quick exploration
- Real-time statistics dashboard

## 🚧 Coming Soon (Phase 1)

### 🔒 **Rate Limiting & Throttle Controls**
- SMS rate limiting per phone number
- Duplicate message detection and spam prevention
- Configurable throttle rules and enforcement

### 🎨 **Enhanced Word Cloud**
- **Semantic positioning** (MDS/UMAP adjacency-based)
- Multiple layout modes (classic, semantic-heavy, balanced)
- Improved animations and visual effects
- Co-occurring term proximity (e.g., wild~salmon)

### 💭 **Sentiment & Emotion Mapping**
- **Plutchik's Wheel** emotion classification
- Color-coded sentiment visualization
- Fine-grained emotion mapping beyond polarity
- Emotion-based clustering and insights

### 🔧 **Moderator Tools**
- Delete/merge/glossary functionality with undo/redo
- Word filtering with right-click UI
- Boolean AND/OR filter logic
- Visual moderation interface

## 🔮 Future Roadmap

### **Phase 2: Advanced Analytics**
- **Demographic Enrichment**: Age, gender, location, occupation collection
- **Geographic Mapping**: Regional sentiment overlays and cloud distributions
- **Advanced Clustering**: HDBSCAN/KMeans respondent grouping
- **Timeline Visualization**: Top-N terms evolution over time

### **Phase 3: AI Insights & Media**
- **AI Insights Dashboard**: Convergence/divergence analytics
- **Missing/Influential Detection**: Automated insight generation
- **Media Integration**: Photo/video ingestion with geotags
- **Advanced Exports**: Visual assets and comprehensive analytics

### **Phase 4: AR/MR & Enterprise**
- **AR/MR Support**: 3D animated clouds and mixed reality clusters
- **Multimodal Feedback**: Voice and video transcript analysis
- **API Integrations**: CRM and engagement platform connectivity
- **Multi-tenant Platform**: Commercial scaling and billing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Twilio account (optional for SMS)

### Local Development
```bash
git clone https://github.com/Data-Tools-Playground/Word-Bubbler.git
cd Word-Bubbler
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the app.

### Environment Setup
Create `.env.local`:
```bash
# Database (Required for Profile System)
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=word_bubble_profiles

# Twilio SMS (Optional - enables SMS features)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
NEXT_PUBLIC_TWILIO_PHONE_NUMBER=your-twilio-number
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Visualization**: D3.js with semantic positioning algorithms
- **Backend**: Next.js API routes, Socket.io WebSocket
- **Database**: PostgreSQL with Drizzle ORM
- **SMS**: Twilio integration with profile linking
- **AI/ML**: OpenAI API, Azure Text Analytics, Hugging Face
- **Deployment**: Vercel with database hosting

### Key Components
- **WordCloud**: Advanced D3.js visualization with semantic positioning
- **ProfileManagement**: Comprehensive participant intelligence dashboard
- **SMSIntegration**: Profile-linked SMS with invite management
- **LiveSession**: Real-time collaborative polling interface
- **ProfileService**: Business logic for longitudinal participant tracking

## 📊 Data Model (PRD-Aligned)

### Core Entities
- **CloudSession**: Poll sessions with configuration
- **Message**: Individual SMS/web responses
- **Term**: Processed words with semantic data
- **GlossaryEntry**: Moderator-defined term mappings
- **Profile**: Persistent participant profiles with demographics
- **Cluster**: Respondent groupings with characteristics
- **ThrottleRule**: Rate limiting configurations
- **InsightSnapshot**: Stored analytics and metrics
- **AuditLog**: Change tracking for moderation

See `database/schema.sql` for complete schema.

## 🔧 Usage

### Live Polling Mode
1. **Create Session**: Set title, question, and configuration
2. **Invite Participants**: Share session ID or send SMS invites
3. **SMS Participation**: Participants text `JOIN <session-id>` to join
4. **Real-time Visualization**: Watch word cloud grow with responses
5. **Profile Analytics**: Track participants and identify patterns

### Data Analysis Mode
1. **Upload Data**: CSV/text files or paste bulk responses
2. **Demo Exploration**: Use sample data for quick testing
3. **Visualization**: Generate word clouds from existing data
4. **Profile Analysis**: View participant insights and exports

### Profile Management
- **Search & Filter**: Find participants by phone, tags, engagement
- **Longitudinal Analysis**: Track sentiment evolution and patterns
- **Opinion Leaders**: Identify influential contributors
- **Segmentation**: Export targeted contact lists by criteria

## 🌟 Key Differentiators

### **Persistent Participant Intelligence**
- Phone number-based profiles that persist across sessions
- Longitudinal tracking of engagement and sentiment evolution
- Automatic behavioral tagging and classification

### **Advanced Word Cloud Technology**
- Semantic positioning with term adjacency algorithms
- Real-time animations with WebSocket synchronization
- Multiple visualization modes and moderator controls

### **Comprehensive SMS Integration**
- No app download required - participate via text message
- Profile-linked responses for longitudinal insights
- Intelligent command processing and rate limiting

### **Professional Moderator Tools**
- Visual word management with delete/merge/glossary
- Boolean filtering with AND/OR logic
- Undo/redo system for content curation

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect Repository**: Import from GitHub to Vercel
2. **Configure Database**: Set up PostgreSQL (Vercel Postgres, Supabase)
3. **Environment Variables**: Add all required config in Vercel dashboard
4. **Deploy**: Automatic deployment on git push

### Production Requirements
- PostgreSQL database with profile schema
- Twilio account for SMS functionality
- OpenAI API key for AI insights (optional)
- Redis for rate limiting (optional)

See `DEPLOYMENT.md` for detailed setup instructions.

## 🤝 Contributing

We welcome contributions! Please see our contribution guidelines:

1. **Fork & Branch**: Create feature branches from main
2. **Follow Standards**: Use TypeScript, Tailwind CSS, and existing patterns
3. **Test Thoroughly**: Ensure all features work in both live and offline modes
4. **Document Changes**: Update README and CLAUDE.md as needed
5. **Submit PR**: Include clear description of changes and testing

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **D3.js** - Powerful data visualization framework
- **Next.js** - Exceptional React framework with API routes
- **Twilio** - Reliable SMS integration platform
- **Drizzle ORM** - Type-safe database operations
- **PRD Contributors** - Comprehensive product requirements and vision

---

**Ready to transform text into insights?** Deploy your own Word Bubbler instance and start building participant intelligence from day one. 🚀