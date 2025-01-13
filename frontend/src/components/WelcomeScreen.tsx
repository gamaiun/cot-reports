"use client";
import React from "react";
import styled from "styled-components";

interface WelcomeScreenProps {
  onClose: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onClose }) => {
  return (
    <Overlay>
      <WelcomeBox>
        <Disclaimer>
          <p>
            This is a portfolio website built using Next.js (frontend) and Flask
            (backend). It retrieves latest publicly available datasets from{" "}
            <a
              href="https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm"
              target="_blank"
              rel="noopener noreferrer"
            >
              CFTC COT reports
            </a>{" "}
            and performs Net calculations using Python inside a Podman
            container. <br></br>
            <br></br>Please note that this website is not intended for trading
            purposes. Consult a professional financial advisor before making any
            trading decisions.
          </p>
        </Disclaimer>
        <Button onClick={onClose}>Proceed to Main Page</Button>
      </WelcomeBox>
    </Overlay>
  );
};

export default WelcomeScreen;

const JustifiedParagraph = styled.p`
  text-align: justify;
`;
// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7); /* Half-transparent black */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const WelcomeBox = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  h1 {
    margin: 0; /* Remove default margin */
    font-size: 20px;
    margin-bottom: 10px; /* Optional spacing below the title */
  }

  p {
    margin: 0; /* Remove default margin */
    font-size: 14px;
  }
`;

const Disclaimer = styled.div`
  margin-top: 20px;
  padding: 10px;
  font-size: 14px;
  color: #555;
  background-color: #f9f9f9;
  border-radius: 4px;
  text-align: justify;
  a {
    color: #0073e6;
    text-decoration: underline;
  }

  a:hover {
    color: #005bb5;
  }
`;

const Button = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #7983de;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;

  &:hover {
    background-color: #4a61e1;
  }
`;
