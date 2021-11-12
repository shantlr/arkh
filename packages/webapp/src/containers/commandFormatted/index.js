const Arg = ({ arg, params }) => {
  if (!arg) {
    return null;
  }
  if (arg.type === 'static') {
    return <span>{arg.value}</span>;
  }
  if (arg.type === 'variable') {
    return <span>{params[arg.name] ? params[arg.name] : `$${arg.name}`}</span>;
  }
  return null;
};

export const CommandFormatted = ({ className, template, params }) => {
  if (!template) {
    return null;
  }

  return (
    <span className={className}>
      {template.bin}
      {template.args.map((arg, index) => (
        <span key={index} className="ml-2">
          <Arg key={index} arg={arg} params={params} />
        </span>
      ))}
    </span>
  );
};
