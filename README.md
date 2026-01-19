# Access Lens 👁️‍🗨️

## Inspiration
Many websites are not built with accessibility in mind, making the internet difficult to navigate for people with visual impairments, dyslexia, or ADHD. We wanted to create a tool that not only helps users adapt websites to their needs but also encourages developers to build more accessible sites from the start.

## What It Does
**Access Lens** is a Chrome extension designed to improve web accessibility for users with visual impairments, dyslexia, and ADHD.

### Color Blindness Support
We provide a contrast enhancement tool that adjusts colors to reduce clashing for users with various types of color blindness.

### Visual Impairment Support
Access Lens includes an accessibility rating system that scores websites directly in Google search results. The score is based on:
- Alt-image tag ratio  
- Proper heading hierarchy (h1 → h2 → h3)  
- Semantic HTML usage  
- ARIA labels  

This helps developers and site maintainers quickly identify accessibility issues.

### Low Accessibility Pages
For pages with low accessibility ratings, Access Lens generates AI-powered descriptions for images missing alt tags.

### Dyslexia Support
We offer several readability tools, including:
- OpenDyslexic font  
- Adjustable letter spacing  
- Font sizing controls  
- Bold text options  

All features are designed to improve reading comfort for users with dyslexia.

### ADHD Support
Access Lens provides AI-powered text simplification, rewriting complex sentences into clearer, easier-to-read versions.

## How We Built It
Access Lens was built as a **Chrome Extension using Manifest V3**.

- **Frontend:** HTML, CSS, and vanilla JavaScript (popup UI)
- **Content Scripts:** Modify page styles and text in real time
- **Backend:** Express.js server hosted on Render  
- **APIs Used:**  
  - Cohere for text simplification  
  - Gemini for image descriptions  
- **Storage:** Chrome Storage API to persist user preferences across sessions

## Challenges We Ran Into
- **CORS issues:**  
  Collecting URLs from Google search results worked locally but was blocked in production due to CORS policies. We solved this by using background service worker mediation, allowing the background script to fetch URLs on behalf of content scripts.

- **Runaway API requests:**  
  A loop in the Gemini image description feature caused over 5,000 API requests. Fortunately, built-in rate limiting prevented excessive costs.

- **Model selection:**  
  After benchmarking multiple Gemini models, we selected **gemini-2.0-flash**, which proved to be both the fastest and the most generous in rate limits.

## Accomplishments We’re Proud Of
- Successfully integrating Gemini and Cohere APIs into a browser extension  
- Deploying our first cloud-hosted API using Render  
- Building a complete accessibility toolkit addressing multiple needs  
- Learning how to work around browser security restrictions  

## What We Learned
- Chrome Extension architecture (content scripts, background workers, message passing)
- Handling CORS restrictions using background service workers
- The importance of API rate limiting
- Deploying and hosting a Node.js backend
- Real-world accessibility challenges and how small changes can make a big impact

## What’s Next for Access Lens
- More color blindness modes (protanopia, deuteranopia, tritanopia)
- Persistent settings across revisited pages
- Screen reader integration
- Browser support for Firefox and Edge
- Downloadable accessibility reports for developers
- Community feedback and reporting system