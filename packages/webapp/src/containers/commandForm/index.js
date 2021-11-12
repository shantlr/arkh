import { Spinner } from '@chakra-ui/spinner';
import { Button } from 'components/entry/button';
import { FormInput } from 'components/entry/formInput';
import { Select } from 'components/entry/select';
import { CommandFormatted } from 'containers/commandFormatted';
import { SelectDirectory } from 'containers/selectDirectory';
import { Form, Formik } from 'formik';
import { useTemplates } from 'hooks';
import { map } from 'lodash-es';
import { useCallback } from 'react';

const TemplateParametersForm = ({ template, params, errors, onChange }) => {
  if (!template) {
    return null;
  }
  const variables = template.args.filter((a) => a.type === 'variable');

  return (
    <div>
      {variables.map((v) => (
        <div key={v.name} className="flex items-center">
          <div className="ml-24 mr-3">{v.name}</div>
          <div>
            <FormInput
              value={params[v.name] || ''}
              error={errors ? errors[v.name] : null}
              onChange={(value) =>
                onChange({
                  ...params,
                  [v.name]: value,
                })
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const CommandForm = ({
  initialValues = {
    name: '',
    template_id: null,
    params: {},
    config: {},
  },
  submitText = 'Create',
  onCancel,
  onSubmit,
}) => {
  const { isLoading, data: templates } = useTemplates();

  const validator = useCallback(
    (values) => {
      const errors = {};

      if (!values.name) {
        errors.name = 'Command name is required';
      }
      if (!values.template_id) {
        errors.template = 'Template is required';
      } else {
        if (templates) {
          const template = templates.find((t) => t.id === values.template_id);
          const params = {};
          template.args.forEach((arg) => {
            if (
              arg.type === 'variable' &&
              typeof values.params[arg.name] === 'undefined'
            ) {
              params[arg.name] = `Parameter ${arg.name} is required`;
            }
          });

          if (Object.keys(params).length) {
            errors.params = params;
          }
        }
      }

      return errors;
    },
    [templates]
  );

  return (
    <Formik
      initialValues={initialValues}
      validate={validator}
      onSubmit={onSubmit}
    >
      {({ values, errors, isValid, setFieldValue }) => (
        <Form>
          <FormInput
            className="mb-3"
            value={values.name}
            placeholder="Command name"
            error={errors.name}
            onChange={(e) => setFieldValue('name', e)}
          />
          <SelectDirectory
            value={values.path}
            onChange={(p) => setFieldValue('path', p)}
          />
          <div className="mb-3">
            <Select
              value={values.template_id}
              {...(isLoading
                ? {
                    icon: <Spinner />,
                  }
                : null)}
              onChange={(e) => {
                setFieldValue('template_id', e.value);
                setFieldValue('params', {});
              }}
              placeholder="Template"
              options={map(templates, (template) => ({
                value: template.id,
                label: template.name,
              }))}
            />
          </div>

          {values.template && Array.isArray(templates) && (
            <CommandFormatted
              className="text-gray-400"
              template={templates.find((t) => t.id === values.template_id)}
              params={values.params}
            />
          )}

          {values.template_id && Array.isArray(templates) && (
            <TemplateParametersForm
              template={templates.find((t) => t.id === values.template_id)}
              params={values.params}
              onChange={(params) => setFieldValue('params', params)}
              errors={errors.params}
            />
          )}
          <div className="flex justify-end">
            {onCancel && (
              <Button className="mr-3" colorScheme="red" onClick={onCancel}>
                Cancel
              </Button>
            )}

            <Button type="submit" disabled={!isValid}>
              {submitText}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};
