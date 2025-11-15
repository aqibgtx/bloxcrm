-- Trigger to automatically set client status to 'client' when assigned to a project

CREATE OR REPLACE FUNCTION update_client_status_on_project()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET status = 'client'
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_update_client_status
AFTER INSERT OR UPDATE OF client_id ON projects
FOR EACH ROW
WHEN (NEW.client_id IS NOT NULL)
EXECUTE FUNCTION update_client_status_on_project();
