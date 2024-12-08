# Atlas

Welcome to  Atlas, _designed to take the world off of your shoulders_.

This project is a personal assistant application designed to automate and streamline various aspects of my daily life. It currently reminds you about birthdays by sending messages via Slack and is planned to include additional features such as budget updates, monthly birthday summaries, and an endpoint for transcribing journal entries using the OpenAI Whisper API.

![ezgif-2-de8c0f962e](https://github.com/user-attachments/assets/5f42bf35-c4e8-4cdd-ae38-3a23345191f0)

## Features

- **Daily Birthday Reminders**: Sends you a personalized message every morning with a list of friends whose birthdays are today.
- **Future Features**:
  - **Budget Updates**: Receive regular updates on your budget to help you manage your finances effectively.
  - **Monthly Birthday Summaries**: Get a summary of upcoming birthdays at the beginning of each month.
  - **Journal Transcription Endpoint**: Transcribe your journal entries using the Whisper API for easy storage and retrieval.

## Technology Stack

- **Node.js** with **TypeScript**: The core application is built using Node.js for server-side operations, with TypeScript providing type safety and improved developer experience.
- **SQLite** with **Sequelize ORM**: Utilizes SQLite for a lightweight relational database solution, managed through Sequelize for easy data modeling and queries.
- **Slack API**: Integrates with Slack to send you messages directly to your preferred channel.
- **Logging**: Implements logging using `winston` for robust and flexible logging capabilities.
