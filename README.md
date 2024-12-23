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
3. Install dependencies for the project:
   ```
   npm install && npm install --prefix client && npm install --prefix server
   ```

### Running the Application

1. In the root project directory, run:
   ```
   npm run dev
   ```

### Usage

- Access the application in your browser at `http://localhost:3000`.
- Navigate to the "Lost and Found" feature to post and search for items.

## Contributing

Feel free to submit issues or pull requests for improvements and new features. 

## License

This project is licensed under the MIT License.
