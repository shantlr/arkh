import styled from 'styled-components';

export const Button = styled.button`
  cursor: pointer;
  border: none;
  background: ${(props) => props.theme.color.actionBg};
  color: ${(props) => props.theme.color.actionColor};

  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: 5px 8px;

  transition: all 0.3s;
  :hover {
    opacity: 0.8;
  }
  :active {
    opacity: 0.9;
  }
`;
