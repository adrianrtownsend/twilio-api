<!-- 
Credit to readme template author: 
https://github.com/othneildrew/Best-README-Template/blob/master/BLANK_README.md 
Thank you!
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

# Twilio API

## About The Project
This project is to create a custom, scalable API to connect with a Twilio phone number to handle automated sending & receiving of text messages along with other functions. This project is currently configured to integrate with Wordpress Gravity forms plugin and Mautic CRM software.

Some of the available functions are:
* API registry & token/session handling
* Triggering new automated studio chatbot flows
* Creating new conversations with or without flows & custom webhooks
* Pre-Conversation functions (checking for existing conversations, mobile number verification, addition of default participants)

More features to be continually added to this project

## Getting Started
To get a local copy up and running follow these simple steps.

### Prerequisites
* npm
```sh
npm install npm@latest -g
```

* MongoDB Atlas Account and Cluster
Account used to host database users, api information, and optionally twilio conversation details

* Twilio Account with SMS Phone number linked - 
[How To Get Twilio Number](https://www.twilio.com/docs/phone-numbers)

### Installation
1. Clone the repo
```sh
git clone https://github.com/adrianrtownsend/twilio-api.git
```

2. Create new .env file from .env-example template and set variables

3. Install NPM packages
```sh
npm install
```

## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/adrianrtownsend/twilio-api.svg?style=for-the-badge
[contributors-url]: https://github.com/adrianrtownsend/twilio-api/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/adrianrtownsend/twilio-api.svg?style=for-the-badge
[forks-url]: https://github.com/adrianrtownsend/twilio-api/network/members
[stars-shield]: https://img.shields.io/github/stars/adrianrtownsend/twilio-api.svg?style=for-the-badge
[stars-url]: https://github.com/adrianrtownsend/twilio-api/stargazers
[issues-shield]: https://img.shields.io/github/issues/adrianrtownsend/twilio-api.svg?style=for-the-badge
[issues-url]: https://github.com/adrianrtownsend/twilio-api/issues
[license-shield]: https://img.shields.io/github/license/adrianrtownsend/twilio-api.svg?style=for-the-badge
[license-url]: https://github.com/adrianrtownsend/twilio-api/blob/master/License.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/adrianrtownsend