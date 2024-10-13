import express from 'express';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to launch Chrome and run Lighthouse
const runLighthouse = async (url) => {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
        logLevel: 'info',
        output: 'json', // Change output to 'json'
        port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);

    await chrome.kill();

    return runnerResult;
};

// Save the report to a JSON file
const saveReportToFile = (report, url) => {
    const fileName = `report-${Date.now()}.json`; // Create a unique filename using timestamp
    const reportsDir = path.join(__dirname, 'reports'); // Path to the reports directory
    const filePath = path.join(reportsDir, fileName); // Full path for the new report file

    // Create reports directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
    }

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2)); // Save the report
    return filePath; // Return the path to the saved report
};

// Endpoint to generate a Lighthouse report
// Endpoint to generate a Lighthouse report
app.post('/api/lighthouse/report', async (req, res) => {
  const { url } = req.body;

  if (!url) {
      return res.status(400).json({ error: 'URL is required' });
  }

  try {
      const result = await runLighthouse(url);

      // Extract the specific fields you want
      const { lighthouseVersion, requestedUrl, audits } = result.lhr;

      // Create HTML content with the extracted fields
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Comprehensive SEO Report</title>
          <style>
              :root {
                  --primary-color: #4a90e2;
                  --secondary-color: #f5a623;
                  --text-color: #333;
                  --background-color: #f8f9fa;
                  --card-background: #ffffff;
              }
              body {
                  font-family: 'Arial', sans-serif;
                  line-height: 1.6;
                  color: var(--text-color);
                  background-color: var(--background-color);
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .header {
                  background-color: var(--primary-color);
                  color: white;
                  text-align: center;
                  padding: 2em;
                  margin-bottom: 30px;
              }
              .header h1 {
                  margin: 0;
                  font-size: 2.5em;
              }
              .section {
                  background-color: var(--card-background);
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  padding: 25px;
                  margin-bottom: 30px;
              }
              .section h2 {
                  color: var(--primary-color);
                  border-bottom: 2px solid var(--primary-color);
                  padding-bottom: 10px;
                  margin-top: 0;
              }
              .metric {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 15px;
                  padding: 10px;
                  background-color: #f0f4f8;
                  border-radius: 5px;
              }
              .score {
                  font-weight: bold;
                  font-size: 1.2em;
              }
              .good { color: #4CAF50; }
              .average { color: #FFA500; }
              .poor { color: #FF0000; }
              .recommendations ul {
                  padding-left: 20px;
              }
              .recommendations li {
                  margin-bottom: 10px;
              }
              .chart {
                  width: 100%;
                  height: 300px;
                  margin-top: 20px;
              }
              @media (max-width: 768px) {
                  .container {
                      padding: 10px;
                  }
                  .header {
                      padding: 1em;
                  }
                  .header h1 {
                      font-size: 2em;
                  }
              }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js"></script>
      </head>
      <body>
          <div class="header">
              <h1>Comprehensive SEO Report For : ${requestedUrl}</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="container">
              <div class="section">
                  <h2>Executive Summary</h2>
                  <p>This report provides a detailed analysis of the SEO performance for ${requestedUrl}. Our evaluation covers key areas including performance metrics, accessibility, best practices, and SEO optimization opportunities. The following sections break down each aspect and offer actionable recommendations for improvement.</p>
              </div>

              <div class="section">
                  <h2>Overall Scores</h2>
                  <div class="chart">
                      <canvas id="scoresChart"></canvas>
                  </div>
              </div>

              <div class="section">
                  <h2>Lighthouse Audits</h2>
                  ${Object.entries(audits).map(([key, audit]) => `
                      <div class="metric">
                          <span>${audit.title}:</span>
                          <span class="score ${audit.score}">${audit.score}</span>
                      </div>
                      <p>${audit.description}</p>
                  `).join('')}
              </div>

              <div class="section">
                  <h2>Conclusion</h2>
                  <p>Based on our comprehensive analysis, ${requestedUrl} shows promise but has several areas for improvement in terms of SEO and overall web performance. By addressing the recommendations provided, particularly in the areas of performance optimization and SEO best practices, the website can significantly enhance its search engine visibility, user experience, and overall digital presence.</p>
              </div>
          </div>

          <script>
              // Chart for Overall Scores
              var ctx = document.getElementById('scoresChart').getContext('2d');
              var scoresChart = new Chart(ctx, {
                  type: 'bar',
                  data: {
                      labels: ['Performance', 'Accessibility', 'Best Practices', 'SEO'],
                      datasets: [{
                          label: 'Scores',
                          data: [75, 90, 85, 70],
                          backgroundColor: [
                              'rgba(255, 165, 0, 0.6)',
                              'rgba(75, 192, 192, 0.6)',
                              'rgba(54, 162, 235, 0.6)',
                              'rgba(255, 99, 132, 0.6)',
                          ],
                      }]
                  },
                  options: {
                      scales: {
                          y: {
                              beginAtZero: true,
                              max: 100,
                          }
                      }
                  }
              });

              function getScoreClass(score) {
                  if (score === null) return '';
                  return score >= 0.9 ? 'good' : score >= 0.5 ? 'average' : 'poor';
              }

              function getScoreDisplay(audit) {
                  return audit.scoreDisplayMode === 'binary' ? (audit.score ? 'Yes' : 'No') : audit.score !== null ? (audit.score * 100).toFixed(0) + '/100' : 'N/A';
              }
          </script>
      </body>
      </html>
      `;

      res.status(200).send(htmlContent);
  } catch (error) {
      console.error('Error running Lighthouse:', error);
      res.status(500).json({ error: 'An error occurred while generating the report.' });
  }
});

// Endpoint to view the report (only sends JSON now)
app.get('/api/lighthouse/view', (req, res) => {
    res.status(200).json({
        message: 'This is where you can view the Lighthouse report',
        additionalInfo: 'Implementation for viewing reports is needed.',
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
