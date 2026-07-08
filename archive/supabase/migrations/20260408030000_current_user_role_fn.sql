-- current_user_role() function (single source of truth)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'employe'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
