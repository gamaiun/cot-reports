import styled, { keyframes } from "styled-components";

// Keyframes for the spinner animation
const spinAnimation = keyframes`
  0% {
    clip-path: polygon(50% 50%, 0 0, 0 0, 0 0, 0 0, 0 0);
  }
  25% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 0, 100% 0, 100% 0);
  }
  50% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 100% 100%, 100% 100%);
  }
  75% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 100%);
  }
  100% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 0);
  }
`;

// Wrapper to center the spinner
const CenterWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #f8f9fa; /* Optional: set a background color */
  margin: 0;
`;

// Spinner component
const Spinner = styled.div`
  width: 60px;
  aspect-ratio: 1;
  border: 15px solid #ddd;
  border-radius: 50%;
  position: relative;
  transform: rotate(45deg);

  &::before {
    content: "";
    position: absolute;
    inset: -15px;
    border-radius: 50%;
    border: 15px solid #514b82;
    animation: ${spinAnimation} 2s infinite linear;
  }
`;

const Loader = () => {
  return (
    <CenterWrapper>
      <Spinner />
    </CenterWrapper>
  );
};

export default Loader;
