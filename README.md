# 🤖 Discord Sekai Bot

A Node.js-based bot project with modular structure, general configuration utility, and future support for cloud deployment (24/7 runtime).

---

## 📂 File Structure

├── bot.js # Entry point of the bot\
├── deploy-commands.js # Deploy slash command to discord base on server channel id\
│\
├── utils/ # General utilities\
│ ├── config.js # Centralized config handler\
│ └── handleXXX.js\
│\
├── .env # Store local CLIENT_ID, SERVER_ID and DISCORD_TOKEN\
├── package.json # Project dependencies & scripts\
├── .gitignore\
└── README.md\

