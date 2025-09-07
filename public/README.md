# Business Partner Dashboard

A modern, AI-powered business dashboard with chat functionality using Claude AI.

## Features

- 🤖 **AI Chat Assistant**: Natural language interface powered by Claude
- 📊 **Business Analytics**: Visual dashboard with key metrics
- 💡 **Smart Insights**: AI-generated business recommendations
- 🎨 **Modern UI**: Beautiful design with Tailwind CSS
- 📱 **Responsive**: Works on desktop and mobile devices

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Claude API key from Anthropic

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   Create a `.env` file or set environment variables:
   ```bash
   export CLAUDE_API_KEY="your-claude-api-key-here"
   export PORT=3001  # Optional, defaults to 3001
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

4. **Start the Dashboard**
   ```bash
   npm run dashboard
   ```

5. **Open in Browser**
   Navigate to `http://localhost:3001`

## Usage

### Chat Interface

- Type natural language queries about your business
- Use quick action buttons for common topics
- Chat history is maintained during the session
- Clear chat anytime with the trash icon

### Sample Questions

- "How can I improve my customer retention?"
- "What marketing strategies work best for small businesses?"
- "Help me analyze my quarterly performance"
- "What should I focus on for business growth?"

### API Endpoints

- `GET /` - Dashboard homepage
- `POST /chat` - Send messages to Claude AI
- `GET /health` - Check API status

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_API_KEY` | Your Claude API key from Anthropic | Required |
| `PORT` | Server port number | 3001 |

### Claude API Setup

1. Sign up at [Anthropic](https://www.anthropic.com/)
2. Get your API key from the dashboard
3. Set the `CLAUDE_API_KEY` environment variable

## Troubleshooting

### Common Issues

**"API Key Required" Status**
- Ensure `CLAUDE_API_KEY` is set correctly
- Restart the server after setting environment variables

**Connection Issues**
- Check your internet connection
- Verify the Claude API key is valid
- Check the browser console for errors

**Build Errors**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)

## Development

### Project Structure

```
├── src/
│   ├── dashboard.ts     # Express server
│   └── index.ts         # Original MCP server
├── public/
│   ├── index.html       # Dashboard UI
│   ├── script.js        # Frontend JavaScript
│   └── README.md        # This file
├── package.json
└── tsconfig.json
```

### Scripts

- `npm run build` - Compile TypeScript
- `npm run dashboard` - Start dashboard server
- `npm start` - Start original MCP server
- `npm run auth` - Authenticate Gmail (for MCP features)

## License

ISC License - See LICENSE file for details 