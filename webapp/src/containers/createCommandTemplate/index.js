import { API } from 'api';
import { useCallback } from 'react';
import { CommandTemplateForm } from '../commandTemplateForm';

export const CreateCommandTemplate = ({
  initialValues,
  onCancel,
  onCreated,
}) => {
  const onSubmit = useCallback(
    async ({ name, bin, args }) => {
      try {
        await API.template.create({ name, bin, args });
        if (typeof onCreated === 'function') {
          onCreated();
        }
      } catch (err) {
        //
      }
    },
    [onCreated]
  );

  return (
    <CommandTemplateForm
      initialValues={initialValues}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
};
