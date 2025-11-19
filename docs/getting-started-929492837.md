# Getting Started

Welcome to the HAWKI Model Repository! This guide will walk you through setting up and running the project on your local machine.

## Overview

At its core, this project is a backend data processing application. Its main purpose is to automatically build a **comprehensive database** of AI models and consolidate all the information into a single `models.json` file.

It's important to understand that this is **not a web server**. Instead, it's a powerful script that runs on a schedule using a GitHub Action. This script executes a an automated workflow called the **Data Processing Pipeline**:

1. **Fetch**: The script reaches out to various online sources (like OpenRouter) to gather the latest information on available AI models.
2. **Process & Enrich**: It takes the raw data and enhances it through a series of "pluggable processing steps." This includes tasks like generating model summaries with AI, translating descriptions into different languages, and converting pricing information into various currencies. To keep things fast and cost-effective, it uses caching for expensive operations.
3. **Store**: Finally, the script saves the clean, processed, and consolidated data into the `models.json` file in the repository's root directory.

The entire backend application lives within the `.github` directory, specifically in `.github/.generate` (the source code) and `.github/workflows` (the automation configuration).

## Prerequisites

Before you begin, ensure you have the following installed and configured on your system:

* **Git**: For cloning the repository.
* **Node.js**: Version 24 or later is recommended. You can check your version with `node -v`.
* **npm**: The Node.js package manager, which comes with Node.js.
* **GitHub Account**: You will need a GitHub account with SSH access configured to clone the repository.

You will also need to acquire the following API keys to run the data pipeline, as it relies on external services for data enrichment:

* **OpenRouter API Key**: To fetch the base model list.
* **DeepL API Key**: To translate model descriptions.
* **OpenAI API Key**: To generate summaries for model descriptions.

## Setup and Installation

Follow these steps to get the project set up on your local machine.

### 1. Clone the Repository

First, clone the repository to your local machine using Git. Open your terminal and run the following command. This requires that you have your SSH keys configured with your GitHub account.

```bash
git clone git@github.com:hawk-digital-environments/hawki-model-repository.git
cd hawki-model-repository
```

### 2. Install Dependencies

The project's dependencies are managed with npm. The backend script and its `package.json` file are located in the `.github/.generate` directory.

Navigate to this directory and install the dependencies using `npm ci`, which ensures a clean and consistent installation based on the `package-lock.json` file.

```bash
cd .github/.generate
npm ci
```

### Step 3: Configure Environment Variables

The script needs your API keys to run. The easiest way to provide them for local development is by creating a `.env` file inside the `.github/.generate` directory.

1. Create a file named `.env`:
   ```bash
   touch .env
   ```

2. Open the `.env` file in a text editor and add your API keys in the following format. The script is configured to read environment variables prefixed with `INPUT_`.

   ```
   # .github/.generate/.env

   INPUT_OPEN-ROUTER-KEY="your_openrouter_api_key_here"
   INPUT_DEEPL-KEY="your_deepl_api_key_here"
   INPUT_OPEN-AI-KEY="your_openai_api_key_here"
   ```
   Replace the placeholder text with your actual keys. The npm script is configured to automatically load these variables when you run it.

### Step 4: Run the Data Pipeline

Now you are ready to start the pipeline. Run the following command:

```bash
npm start
```

> `npm start` vs `npm run model-list`:
> Use the `npm start` command for local development (with a .env file). The `npm run model-list` command is used in the GitHub Actions workflow, where environment variables are provided differently.

This command executes the main script (`.github/.generate/src/updateModelList.ts`), which will:

- Fetch model data from the configured sources (like OpenRouter).
- De-duplicate and process the models.
- Generate descriptions, summaries, and pricing information.
- Save the final output.

You will see log messages in your terminal as the script progresses.

### Step 5: Check the Output

Once the script completes successfully, it will have created or updated two files in the **root directory** of the repository:

* `models.json`: The final, unified list of all processed model information.
* `models.hashes.json`: A file containing hashes of model data, used to detect changes on subsequent runs.

Congratulations! You have successfully run the HAWKI Model Repository data pipeline on your local machine. You can now inspect the `models.json` file to see the freshly aggregated data.

## Exploring the Heart of the Pipeline

With the HAWKI Model Repository pipeline now running successfully, you've glimpsed the surface of a robust data processing system. In the next chapter, we'll dive deeper into the [Data Processing Pipeline](data-processing-pipeline-1338362951.md), uncovering how this script-based backend orchestrates data from multiple sources, enriches it through targeted steps, and consolidates everything into a comprehensive `models.json` file. Get ready to explore the core workflow that powers the entire process.
