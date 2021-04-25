const Arg = ({ arg }) => {
  if (arg.type === 'static') {
    return <span>{arg.value}</span>;
  }

  return <span>${arg.name}</span>;
};

export const TemplateFormattedCommand = ({ className, template }) => {
  return (
    <span className={className}>
      {template.bin}{' '}
      {template.args.map((arg, index) => (
        <span key={index} className="ml-1">
          <Arg arg={arg} />
        </span>
      ))}
    </span>
  );
};
