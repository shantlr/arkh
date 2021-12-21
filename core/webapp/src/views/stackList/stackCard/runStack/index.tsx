import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/button';
import { API } from 'configs';
import { useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

const Title = styled.div<{ show?: boolean }>`
  font-size: ${(props) => props.theme.fontSize.sm};
  margin-right: ${(props) => props.theme.space.sm};
  transition: 0.4s;
  opacity: 0;
  transform: translate(100px);
  ${(props) => (props.show ? `opacity: 1; transform: translate(0);` : null)};
`;
const Container = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  transition: ${(props) => props.theme.transition.default};
`;

export const RunStack = ({
  className,
  stackName,
  shrinked,
}: {
  className?: string;
  stackName: string;
  shrinked?: boolean;
}) => {
  const [show, setShow] = useState(false);
  const { mutate: runStack } = useMutation(() =>
    API.stack.run({
      name: stackName,
    })
  );

  return (
    <Container className={className}>
      {!shrinked && <Title show={show}>Run stack</Title>}
      <Button
        size={shrinked ? 'sm' : 'md'}
        onMouseEnter={() => {
          setShow(true);
        }}
        onMouseLeave={() => {
          setShow(false);
        }}
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
