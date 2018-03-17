defmodule Util.Priv do
  def get_priv_path(filename) do
    path = __MODULE__ |> Application.get_application() |> Application.app_dir("priv/data/")
    Path.join(path, filename)
  end
end
