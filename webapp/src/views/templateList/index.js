import { useState } from 'react';
import { useQuery } from 'react-query';
import { Button, Spinner } from '@chakra-ui/react';
import { map } from 'lodash';

import { TemplateFormattedCommand } from 'containers/templateFormattedCommand';
import { CreateCommandTemplate } from 'containers/createCommandTemplate';
import { CommandTemplateForm } from 'containers/commandTemplateForm';
import { API } from 'api';
import { useTemplates } from 'hooks';

const AddTemplate = () => {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <Button
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

  return (
    <div
      className="container rounded shadow mb-5 p-3 cursor-pointer"
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
            onSubmit={async (values) => {
              try {
                await API.template.update(template.name, values);
                setShowEdit(false);
              } catch (err) {}
            }}
            submitText="Update"
          />
        </div>
      )}
    </div>
  );
};

export const TemplateList = () => {
  const { isLoading, data } = useTemplates();

  return (
    <div className="p-6 w-full">
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
