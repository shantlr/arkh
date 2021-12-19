import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/button';
import { API } from 'configs';
import { useMutation } from 'react-query';
import styled from 'styled-components';

const Title = styled.div`
  font-size: ${(props) => props.theme.fontSize.sm};
  margin-right: ${(props) => props.theme.space.sm};
  transition: 0.4s;
  opacity: 0;
  transform: translate(100px);
`;
const Container = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  :hover {
    ${Title} {
      transform: translate(0);
      opacity: 1;
    }
  }
`;

export const RunStack = ({ stackName }: { stackName: string }) => {
  const { mutate: runStack } = useMutation(() =>
    API.stack.run({
      name: stackName,
    })
  );

  return (
    <Container>
      <Title>Run stack</Title>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          runStack();
        }}
      >
        <FontAwesomeIcon icon={faPlay} />
      </Button>
    </Container>
  );
};
