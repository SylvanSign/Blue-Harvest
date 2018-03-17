defmodule Util.Priv do
  def get_priv_path(filename) do
    path = __MODULE__ |> Application.get_application() |> Application.app_dir("priv/data/")
    Path.join(path, stringify(filename))
  end

  defp stringify(filename) when is_binary(filename), do: filename
  defp stringify(filename) when is_atom(filename), do: Atom.to_string(filename)
end
