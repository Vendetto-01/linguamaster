CREATE OR REPLACE FUNCTION increment_job_processed_counts(job_id_param BIGINT, succeeded_increment INT, failed_increment INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bulk_jobs
  SET
    processed_words = processed_words + succeeded_increment + failed_increment,
    succeeded_words = succeeded_words + succeeded_increment,
    failed_words = failed_words + failed_increment,
    updated_at = now()
  WHERE id = job_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.increment_job_processed_counts(BIGINT, INT, INT) IS 'Atomically increments processed, succeeded, and failed word counts for a given bulk_job_id.';