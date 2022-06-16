import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { Button } from 'components/button';
import { API } from 'configs';

const Container = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  transition: ${(props) => props.theme.transition.default};
`;

export const RunStack = ({
  className,
  stackName,
}: {
  className?: string;
  stackName: string;
}) => {
  const { mutate: runStack } = useMutation(() =>
    API.stack.run({
      name: stackName,
    })
  );

  return (
    <Container className={className}>
      <Button
        size="sm"
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
