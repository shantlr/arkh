import { Button } from '@chakra-ui/button';
import { Select } from '@chakra-ui/select';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { FormInput } from 'components/formInput';
import { TemplateFormattedCommand } from 'containers/templateFormattedCommand';

import { FieldArray, Form, Formik } from 'formik';

const ArgForm = ({ className, error, value: arg, onChange, onDelete }) => {
  const { type } = arg;

  return (
    <div className={`flex ${className}`}>
      <div className="mr-3 min-w-3">
        <Select
          value={type}
          onChange={(e) => {
            console.log(e.target.value);
            onChange({
              ...arg,
              type: e.target.value,
            });
          }}
        >
          <option value="static">Static</option>
          <option value="variable">Variable</option>
        </Select>
      </div>

      {type === 'variable' && (
        <FormInput
          className="mr-3"
          placeholder="Arg name"
          error={error && error.name}
          value={arg.name}
          onChange={(name) => {
            onChange({
              ...arg,
              name,
            });
          }}
        />
      )}

      {type === 'static' && (
        <FormInput
          value={arg.value}
          placeholder="Value"
          className="mr-3"
          error={error && error.value}
          onChange={(value) => {
            onChange({
              ...arg,
              value,
            });
          }}
        />
      )}
      <Button colorScheme="red" onClick={onDelete}>
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    </div>
  );
};

const validator = (values) => {
  const errors = {};
  if (!values.bin) {
    errors.bin = `Binary name is required`;
  }

  errors.args = [];
  values.args.forEach((arg, idx) => {
    const err = {};
    if (arg.type === 'static') {
      if (!arg.value) {
        err.value = 'Value is required';
      }
    } else if (arg.type === 'variable') {
      if (!arg.name) {
        err.name = 'Variable name is required';
      }
    }

    if (Object.keys(err).length) {
      errors.args[idx] = err;
    }
  });

  if (!errors.args.length) {
    delete errors.args;
  }

  return errors;
};

export const CommandTemplateForm = ({
  initialValues = {
    name: '',
    bin: '',
    args: [],
  },
  onCancel,
  onSubmit,
  submitText = 'Create',
}) => {
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validate={validator}
    >
      {({ values, isValid, setFieldValue, errors }) => (
        <Form>
          <div className="mb-3">
            <TemplateFormattedCommand
              className="text-gray-600"
              template={values}
            />
          </div>
          <FormInput
            className="mb-3"
            placeholder="Template name"
            error={errors.name}
            value={values.name}
            onChange={(name) => setFieldValue('name', name)}
          />
          <FormInput
            className="mb-3"
            error={errors.bin}
            value={values.bin}
            placeholder="Binary name"
            onChange={(bin) => setFieldValue('bin', bin)}
          />
          <FieldArray
            name="args"
            render={(arrayHelper) => (
              <div>
                <div className="mb-3">Arguments:</div>
                {values.args.map((arg, index) => (
                  <ArgForm
                    className="mb-2"
                    key={index}
                    value={arg}
                    error={errors.args ? errors.args[index] : null}
                    onChange={(nextValue) => {
                      arrayHelper.replace(index, nextValue);
                    }}
                    onDelete={() => arrayHelper.remove(index)}
                  />
                ))}
                <Button
                  size="sm"
                  className="ml-3 focus:outline-none"
                  colorScheme="blue"
                  onClick={() => {
                    arrayHelper.push({
                      type: 'static',
                      value: '',
                    });
                  }}
                >
                  <FontAwesomeIcon className="text-white" icon={faPlus} />
                </Button>
              </div>
            )}
          />
          <div className="flex justify-end">
            {onCancel && (
              <Button colorScheme="red" className="mr-3" onClick={onCancel}>
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
