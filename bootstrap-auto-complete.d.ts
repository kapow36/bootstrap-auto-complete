interface BootstrapAutoCompleteOptions 
{
    url?: string;
    loaderUrl?: string;
    maxCount?: number;
}

interface JQuery
{
    autoComplete(): JQuery;
    autoComplete(options?: BootstrapAutoCompleteOptions): JQuery;
    autoComplete(action: string): boolean;
}
