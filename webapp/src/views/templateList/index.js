import { useState } from 'react';
import { Spinner } from '@chakra-ui/react';
import { map } from 'lodash';

import { TemplateFormattedCommand } from 'containers/templateFormattedCommand';
import { CreateCommandTemplate } from 'containers/createCommandTemplate';
import { CommandTemplateForm } from 'containers/commandTemplateForm';
import { useTemplates, useUpdateTemplate } from 'hooks';
import { Button } from 'components/entry/button';
import { Card } from 'components/display/card';

const AddTemplate = () => {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <Button
        colorScheme="gray"
        onClick={() => {
          setShowForm(true);
        }}
      >
        Add template
      </Button>
    );
  }

  return (
    <CreateCommandTemplate
      onCreated={() => {
        setShowForm(false);
      }}
      onCancel={() => {
        setShowForm(false);
      }}
    />
  );
};

export const TemplateItem = ({ template }) => {
  const [showEdit, setShowEdit] = useState(false);
  const updateTemplate = useUpdateTemplate();

  return (
    <Card
      className="mb-5 cursor-pointer"
      onClick={() => {
        setShowEdit(!showEdit);
      }}
    >
      <span className="mr-3">{template.name}</span>
      {!showEdit && (
        <TemplateFormattedCommand
          className="text-xs text-gray-500"
          template={template}
        />
      )}
      {showEdit && (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <CommandTemplateForm
            initialValues={template}
            onCancel={(e) => {
              setShowEdit(false);
            }}
            onSubmit={(values) => {
              updateTemplate.mutate(
                {
                  id: template.id,
                  template: values,
                },
                {
                  onSuccess: () => {
                    setShowEdit(false);
                  },
                }
              );
            }}
            submitText="Update"
          />
        </div>
      )}
    </Card>
  );
};

export const TemplateList = () => {
  const { isLoading, data } = useTemplates();

  return (
    <div className="p-6 w-full h-full overflow-auto">
      {isLoading && (
        <div>
          {' '}
          <Spinner />
        </div>
      )}
      {data && !data.length && <div className="text-gray-800">No template</div>}
      {map(data, (template) => (
        <TemplateItem key={template.name} template={template} />
      ))}

      <AddTemplate />
    </div>
  );
};
