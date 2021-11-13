import { useToast } from '@chakra-ui/toast';
import { useCreateTemplate } from 'hooks';
import { useCallback } from 'react';
import { CommandTemplateForm } from '../commandTemplateForm';

export const CreateCommandTemplate = ({
  initialValues,
  onCancel,
  onCreated,
}) => {
  const toast = useToast();
  const [createTemplate] = useCreateTemplate();

  const onSubmit = useCallback(
    async ({ name, bin, args }) => {
      createTemplate(
        { name, bin, args },
        {
          onSuccess: () => {
            if (typeof onCreated === 'function') {
              onCreated();
            }
          },
          onError: (err) => {
            toast({
              status: 'error',
              title: 'Could not create template',
              description: err.message,
              position: 'top-right',
              isClosable: true,
            });
          },
        }
      );
    },
    [createTemplate, onCreated, toast]
  );

  return (
    <CommandTemplateForm
      initialValues={initialValues}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
};
