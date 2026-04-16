# Contributing to Prepify 🚀

First off, thank you for considering contributing to Prepify! It's people like you who make Prepify such a great tool for the developer community.

## 🌈 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## 🐛 Generating a Bug Report

When filing an issue, please ensure that you include:
- A clear and descriptive title.
- Steps to reproduce the issue.
- Your current environment (OS, Node version, Python version).
- Actual vs. Expected behavior.
- Screenshots or console logs if applicable.

## 💡 Feature Requests

We love hearing new ideas! When suggesting a feature:
1. Check existing issues to see if it's already been proposed.
2. Explain **why** this feature would be useful to most Prepify users.
3. Sketch out a potential implementation if you have one.

## 🛠️ Your First Code Contribution

### 1. Project Setup
Prepify is a 3-tier application. You will need to set up all three parts to test your changes:
- `frontend/`: React + Vite + TypeScript
- `backend/`: Node.js + Express + Socket.io
- `ai-service/`: FastAPI + Python + Gemini AI

Follow the setup instructions in the [Root README](./README.md).

### 2. Branching Policy
- Create a branch with a descriptive name: `feat/add-new-role` or `fix/typo-in-dashboard`.
- Use `main` as the base for your branch.

### 3. Standards
- **TypeScript**: Ensure all new code is properly typed. Avoid using `any`.
- **Styling**: We use Tailwind CSS following our "Neo-Dark" design system.
- **Python**: Use PEP 8 standards and provide Type Hints for new functions.
- **Documentation**: If you add a new feature or utility, please add JSDoc or Python Docstrings as shown in the existing files.

### 4. Pull Request Process
1. Update the READMEs if you change the setup process or add environment variables.
2. Ensure your code doesn't break the existing `start-all.bat` execution.
3. Your PR should ideally include a short video or screenshot of the change in action.
4. Once submitted, a maintainer will review your PR and provide feedback.

## 🏗️ Technical Architecture Reminder

- **AI Calls**: Always keep the `ai-service` footprint minimal. Avoid adding heavy ML libraries locally; try to utilize the Gemini API for processing where possible.
- **Persistence**: Any session-specific data that needs to survive a reload should be handled via the Redux store + IndexedDB sync in `frontend/src/utils/idb.ts`.

## 💬 Communication

If you have questions, feel free to open a "Discussion" or contact the maintainer at `rajarnab31@gmail.com`.

Happy coding! 👩‍💻👨‍💻
