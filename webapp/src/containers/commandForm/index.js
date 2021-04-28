import { Select } from '@chakra-ui/select';
import { Spinner } from '@chakra-ui/spinner';
import { Button } from 'components/entry/button';
import { FormInput } from 'components/formInput';
import { CommandFormatted } from 'containers/commandFormatted';
import { Form, Formik } from 'formik';
import { useTemplates } from 'hooks';
import { map } from 'lodash-es';
import { useCallback } from 'react';

const TemplateParametersForm = ({ template, params, errors, onChange }) => {
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
    template: '',
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
      if (!values.template) {
        errors.template = 'Template is required';
      } else {
        const template = templates.find((t) => t.name === values.template);
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
          <div className="mb-3">
            <Select
              value={values.template}
              {...(isLoading
                ? {
                    icon: <Spinner />,
                  }
                : null)}
              onChange={(e) => {
                setFieldValue('template', e.target.value);
                setFieldValue('params', {});
              }}
            >
              {map(templates, (template) => (
                <option key={template.name} value={template.name}>
                  {template.name}
                </option>
              ))}
            </Select>
          </div>
          {values.template && (
            <CommandFormatted
              className="text-gray-400"
              template={templates.find((t) => t.name === values.template)}
              params={values.params}
            />
          )}

          {values.template && (
            <TemplateParametersForm
              template={templates.find((t) => t.name === values.template)}
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
