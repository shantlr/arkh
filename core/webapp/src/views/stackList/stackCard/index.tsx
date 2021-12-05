import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/button';
import { BaseCard } from 'components/card';
import { API } from 'configs';
import { Stack } from 'configs/types';
import { map } from 'lodash';
import { useMutation } from 'react-query';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const StackCardContainer = styled(BaseCard)<{
  active?: boolean;
}>`
  padding: ${(props) => props.theme.space.lg};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  margin-bottom: ${(props) => props.theme.space.md};

  cursor: pointer;
  transition: all 0.5s;

  :hover {
    opacity: 1;
    box-shadow: ${(props) => props.theme.shadow.md};
  }
`;

const StackHeader = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
  flex-wrap: nowrap;
  margin-bottom: ${(props) => props.theme.space.md};
`;
const StackHeaderActions = styled.div``;
const StackTitle = styled.div`
  flex-grow: 1;
  ${(props) => props.theme.color.title};
  font-weight: bold;
`;
const ServiceList = styled.div`
  display: flex;
`;

const ServiceContainer = styled.div`
  background-color: white;
  color: ${(props) => props.theme.color.text};
  margin-right: ${(props) => props.theme.space.md};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: ${(props) => props.theme.space.md};
  cursor: pointer;

  transition: all 0.5s;
  :hover {
    filter: brightness(1.1);
    box-shadow: ${(props) => props.theme.shadow.md};
  }
  :active {
    opacity: 0.8;
  }
`;

export const StackCard = ({
  active,
  stack,
}: {
  active: boolean;
  stack: Stack;
}) => {
  const { mutate: runStack } = useMutation(() =>
    API.stack.run({
      name: stack.name,
    })
  );

  return (
    <StackCardContainer active={active}>
      <StackHeader>
        <StackTitle>{stack.name}</StackTitle>
        <StackHeaderActions>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              runStack();
            }}
          >
            <FontAwesomeIcon icon={faPlay} />
          </Button>
        </StackHeaderActions>
      </StackHeader>
      <ServiceList>
        {map(stack.spec.services, (service, serviceKey) => (
          <Link
            key={serviceKey}
            to={`/stack/${stack.name}/service/${serviceKey}`}
          >
            <ServiceContainer key={serviceKey}>{serviceKey}</ServiceContainer>
          </Link>
        ))}
      </ServiceList>
    </StackCardContainer>
  );
};
