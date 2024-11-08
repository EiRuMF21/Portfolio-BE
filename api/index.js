const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const languageColors = {
  JavaScript: "#F1E05A",
  TypeScript: "#2F74C0",
  // Other languages...
};

// Helper function to extract image URL from README text
function extractImageUrl(text) {
  const regex = /!\[.*\]\((https?.*?\.(?:png|jpg|jpeg|gif|svg))\)/i;
  const match = text.match(regex);
  if (match) {
    console.log("Extracted image URL:", match[1]); // Debugging log for extracted image URL
  } else {
    console.log("No image found in README.md text"); // Log when no image is found
  }
  return match ? match[1] : "";
}

app.get("/api/pinned-repos", async (req, res) => {
  try {
    const graphqlEndpoint = "https://api.github.com/graphql";
    const query = `
      query {
        user(login: "EiRuMF21") {
          pinnedItems(first: 6) {
            edges {
              node {
                ... on Repository {
                  name
                  description
                  stargazerCount
                  url
                  primaryLanguage {
                    name
                  }
                  object(expression: "HEAD:README.md") {
                    ... on Blob {
                      text
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(graphqlEndpoint, { query }, { headers });
    const pinnedRepos = response.data.data.user.pinnedItems.edges.map(
      (item) => {
        const language = item.node.primaryLanguage
          ? item.node.primaryLanguage.name
          : "Unknown";
        const languageColor = languageColors[language] || "#808080";
        const readmeText = item.node.object ? item.node.object.text : "";

        // Debugging log for README content
        console.log(`README for ${item.node.name}:`, readmeText);

        const imageUrl = extractImageUrl(readmeText);

        return {
          name: item.node.name,
          description: item.node.description,
          stars: item.node.stargazerCount,
          link: item.node.url,
          language: language,
          languageColor: languageColor,
          imageUrl: imageUrl || "https://via.placeholder.com/150", // Placeholder if no image found
        };
      }
    );

    res.json(pinnedRepos);
  } catch (error) {
    console.error("Error fetching pinned repos:", error);
    res.status(500).json({ error: "Failed to fetch pinned repos" });
  }
});

module.exports = app;
