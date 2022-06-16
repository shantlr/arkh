import { map } from 'lodash';
import styled from 'styled-components';

const StringSpan = styled.span`
  color: ${(props) => props.theme.logs.json.string};
`;
const NumberSpan = styled.span`
  color: ${(props) => props.theme.logs.json.number};
`;
const PropertySpan = styled.span`
  color: ${(props) => props.theme.logs.json.property};
`;
const NullSpan = styled.span`
  color: ${(props) => props.theme.logs.json.null};
`;

const Indent = styled.div<{ indent: number }>`
  margin-left: ${(props) => `${props.theme.logs.json.indent * props.indent}px`};
`;

export const formatBase = () => {};

export const formatJsonLog = (json: any, indent = 1) => {
  if (json === null) {
    return <NullSpan>null</NullSpan>;
  }
  if (json === undefined) {
    return <NullSpan>undefined</NullSpan>;
  }
  if (typeof json === 'string') {
    return <StringSpan>'{json}'</StringSpan>;
  }
  if (['number', 'bigint', 'boolean'].includes(typeof json)) {
    return <NumberSpan>{json}</NumberSpan>;
  }
  if (Array.isArray(json)) {
    return (
      <div>
        {json.map((value, idx) => (
          <Indent key={idx} indent={indent}>
            - {formatJsonLog(value, indent + 1)}
          </Indent>
        ))}
      </div>
    );
  }

  if (json instanceof Date) {
  }

  if (typeof json === 'object') {
    return (
      <div>
        {map(json, (value, field) => (
          <Indent key={field} indent={indent}>
            <PropertySpan>{field}</PropertySpan>:{' '}
            {formatJsonLog(value, indent + 1)}
          </Indent>
        ))}
      </div>
    );
  }
  return null;
};
