# BirthdayReminderService Design and Usage Documentation

## Overview

The `BirthdayReminderService` is a Node.js module written in TypeScript that automates the process of generating birthday reports and synchronizing contact data. It reads contact profiles from a JSON file, updates a SQLite database using Sequelize ORM, and generates personalized birthday messages for contacts whose birthdays are on the current date. The generated messages can be sent via Slack or any other messaging platform.

## Table of Contents

- [BirthdayReminderService Design and Usage Documentation](#birthdayreminderservice-design-and-usage-documentation)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Data Flow](#data-flow)
  - [Key Components](#key-components)
    - [`generateBirthdayReport`](#generatebirthdayreport)
      - [Description](#description)
      - [Responsibilities](#responsibilities)
    - [`formatBirthdayMessage`](#formatbirthdaymessage)
      - [Description](#description-1)
      - [Responsibilities](#responsibilities-1)
    - [`getBirthdayReport`](#getbirthdayreport)
      - [Description](#description-2)
      - [Responsibilities](#responsibilities-2)
    - [`syncPeopleFromJson`](#syncpeoplefromjson)
      - [Description](#description-3)
      - [Responsibilities](#responsibilities-3)

## Features

- **Data Synchronization**: Reads contacts from a JSON file and syncs them with a SQLite database.
- **Birthday Detection**: Identifies contacts whose birthdays are today.
- **Personalized Messages**: Generates formatted birthday messages, including years of friendship.
- **Database Management**: Inserts, updates, and deletes records in the database based on the JSON file.
- **Logging**: Provides detailed logging for operations and errors.

## Architecture

The service is structured around four main functions:

1. **`generateBirthdayReport`**: Orchestrates the process of syncing data and generating the birthday message.
2. **`formatBirthdayMessage`**: Formats the birthday report into a readable string.
3. **`getBirthdayReport`**: Processes contact data to find today's birthdays.
4. **`syncPeopleFromJson`**: Synchronizes the database with the JSON file.

## Data Flow

1. **Data Synchronization**:

   - Reads `Profiles.json` to get the latest contact information.
   - Updates the `People` table in the SQLite database using Sequelize.
   - Ensures that the database reflects the current state of the JSON file.

2. **Birthday Report Generation**:
   - Fetches all contacts from the database.
   - Filters contacts whose birthdays are today.
   - Calculates the years of friendship for each contact.
   - Formats the data into a birthday message.

## Key Components

### `generateBirthdayReport`

#### Description

- Entry point function that generates the birthday report.
- Handles data synchronization and message formatting.

#### Responsibilities

- Synchronizes data by calling `syncPeopleFromJson`.
- Retrieves all contacts from the database.
- Generates the birthday report.
- Handles errors and logs relevant information.

### `formatBirthdayMessage`

#### Description

- Formats the birthday report into a user-friendly message string.

#### Responsibilities

- Takes an array of `BirthdayReport` objects.
- Builds a formatted string with headers, body, and footer.
- Handles cases where there are no birthdays today.

### `getBirthdayReport`

#### Description

- Filters contacts to find those whose birthdays are today.
- Calculates the years of friendship for each contact.

#### Responsibilities

- Filters the list of people to those whose birthday matches today's date.
- Creates a `BirthdayReport` object for each matching person.

### `syncPeopleFromJson`

#### Description

- Reads the `Profiles.json` file and synchronizes the `People` database table.
- Inserts new records, updates existing ones, and deletes records not present in the JSON file.

#### Responsibilities

- Reads and parses the `Profiles.json` file.
- Synchronizes the database:
  - **Insert** new records.
  - **Update** existing records.
  - **Delete** records not in the JSON file.
- Logs the operations performed.
