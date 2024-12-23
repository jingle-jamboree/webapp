# My MERN App

This is a MERN stack application designed primarily for mobile users. The app features a "Lost and Found" section where users can post found items and search for lost items.

## Project Structure

```
my-mern-app
├── client
│   ├── public
│   │   ├── index.html
│   └── src
│       ├── components
│       │   ├── FeatureButton.js
│       │   ├── FeatureList.js
│       │   └── LostAndFound.js
│       ├── pages
│       │   └── HomePage.js
│       ├── App.js
│       ├── index.css
│       └── index.js
├── server
│   ├── controllers
│   │   └── lostAndFoundController.js
│   ├── models
│   │   └── lostAndFoundModel.js
│   ├── routes
│   │   └── lostAndFoundRoutes.js
│   └── server.js
├── package.json
├── tailwind.config.js
└── README.md
```

## Features

1. **Lost and Found**: Users can post new found items and search for lost items. The feature includes a form for submissions and a list displaying sample data.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd my-mern-app
   ```
3. Install dependencies for both client and server:
   ```
   cd client
   npm install
   cd ../server
   npm install
   ```

### Running the Application

1. Start the server:
   ```
   cd server
   node server.js
   ```
2. In a new terminal, start the client:
   ```
   cd client
   npm start
   ```

### Usage

- Access the application in your browser at `http://localhost:3000`.
- Navigate to the "Lost and Found" feature to post and search for items.

## Contributing

Feel free to submit issues or pull requests for improvements and new features. 

## License

This project is licensed under the MIT License.