import { ActionDropdown } from 'components/actionDropdown';
import { useEffect, useRef } from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { styles } from 'styles/css';

const Icon = styled.div`
  ${styles.text.xxs}
  ${styles.pl.md}
  opacity: 0;
  overflow: hidden;
  ${styles.transition.default}
`;

const Input = styled.input`
  background-color: transparent;
  padding: 0;
  outline: none;
  border: none;
  min-width: 40px;
  width: auto;
  font-weight: bold;
  height: 16px;
  ${styles.color.actionColor}
  ${styles.text.sm}
`;

const TabContainer = styled.div<{ active?: boolean }>`
  cursor: pointer;
  min-width: 40px;
  text-align: center;
  font-weight: bold;
  padding: ${(props) => `0 ${props.theme.space.md}`};
  ${styles.mr.md}

  ${styles.flex.bothCenter}

  ${(props) => (props.active ? styles.base.action : styles.base.secondaryBg)};
  ${styles.rounded.lg};
  ${styles.hover.action};
  ${styles.text.sm};
  ${styles.transition.default};
  :hover {
    ${Icon} {
      opacity: 1;
    }
  }
`;

export const Tab = ({
  name,
  active,
  onChange,
  onDelete,

  defaultEdit = false,
}: {
  name: string;
  active?: boolean;
  onChange: (value: string) => void;
  onDelete?: () => void;

  defaultEdit?: boolean;
}) => {
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [edit, setEdit] = useState(defaultEdit);
  const [localText, setLocalText] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (edit && inputRef.current) {
      inputRef.current.focus();
    }
  }, [edit]);

  return (
    <TabContainer
      active={active || edit}
      ref={setContainerRef}
      onMouseEnter={() => {
        setShow(true);
      }}
      onMouseLeave={() => {
        setShow(false);
      }}
    >
      {edit && (
        <Input
          ref={inputRef}
          onChange={(e) => {
            setLocalText(e.target.value);
          }}
          size={localText.length}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              onChange(localText);
              setEdit(false);
            }
          }}
          value={localText}
          onBlur={() => {
            onChange(localText);
            setEdit(false);
          }}
        />
      )}
      {!edit && <>{name}</>}
      {!edit && show && (
        <ActionDropdown placement="bottom" size="sm" parentRef={containerRef}>
          <div
            key="edit"
            style={{ cursor: 'pointer' }}
            onClick={() => setEdit(true)}
          >
            Edit
          </div>
          {onDelete && (
            <div
              key="delete"
              style={{ cursor: 'pointer' }}
              onClick={() => onDelete()}
            >
              Delete
            </div>
          )}
        </ActionDropdown>
      )}
    </TabContainer>
  );
};
