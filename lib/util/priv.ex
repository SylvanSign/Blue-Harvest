defmodule Util.Data do
  def get_path(filename) do
    path = Application.get_env(:site_hiker, :data_path)
    Path.join(path, stringify(filename))
  end

  defp stringify(filename) when is_binary(filename), do: filename
  defp stringify(filename) when is_atom(filename), do: Atom.to_string(filename)
end
