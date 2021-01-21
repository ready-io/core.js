export default class Module
{
  protected services: any;
  unhandledRejection: boolean;
  exitOnError: boolean;


  constructor()
  {
    this.services           = {};
    this.unhandledRejection = false;
    this.exitOnError        = false;

    this.handleShutdown();
  }


  handleShutdown()
  {
    process.on('unhandledRejection', e => { this.unhandledRejection = true; throw e; });
    process.on('uncaughtException',  e =>
    {
      this.onError(e);
      this.exitOnError = true;

      if (this.unhandledRejection) throw e;
    });

    process.on('exit', code =>
    {
      if (this.exitOnError) code = 1;

      this.onStop(`exit code ${code}`);
      process.exit(code);
    });

    process.on('SIGTERM', () => { this.onStop('SIGTERM'); process.exit(0); });
    process.on('SIGINT',  () => { this.onStop('SIGINT');  process.exit(0); });
  }


  onStop(_reason: any)
  {

  }

  onError(_error: any)
  {

  }
}