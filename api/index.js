const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const languageColors = {
  JavaScript: "#F1E05A",
  TypeScript: "#2F74C0",
  Python: "#3572A5",
  Java: "#B07219",
  Ruby: "#701516",
  Go: "#00ADD8",
  PHP: "#4F5D95",
  C: "#555555",
  CSharp: "#178600",
  Swift: "#F05138",
  Kotlin: "#F6A50F",
  Rust: "#000000",
  HTML: "#E44D26",
  CSS: "#563D7C",
  Dart: "#00B4AB",
};

// Helper function to extract image URL from README text
function extractImageUrl(text) {
  const regex = /!\[.*\]\((https?.*?\.(?:png|jpg|jpeg|gif|svg))\)/i;
  const match = text.match(regex);
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

        // Log README text and check image URL extraction
        console.log("README Text:", readmeText); // Check if README text is correctly retrieved

        const imageUrl = extractImageUrl(readmeText);
        console.log("Extracted Image URL:", imageUrl); // Check if the image URL is extracted correctly

        return {
          name: item.node.name,
          description: item.node.description,
          stars: item.node.stargazerCount,
          link: item.node.url,
          language: language,
          languageColor: languageColor,
          imageUrl: imageUrl || "", // Empty string if no image found
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

