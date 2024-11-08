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
    console.log("GitHub API Response:", response.data);

    const pinnedRepos = response.data.data.user.pinnedItems.edges.map(
      (item) => {
        const language = item.node.primaryLanguage
          ? item.node.primaryLanguage.name
          : "Unknown";
        const languageColor = languageColors[language] || "#808080";

        return {
          name: item.node.name,
          description: item.node.description,
          stars: item.node.stargazerCount,
          link: item.node.url,
          language: language,
          languageColor: languageColor,
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
