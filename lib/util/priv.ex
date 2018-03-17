defmodule Util.Priv do
  def get_priv_dir() do
    __MODULE__ |> Application.get_application() |> Application.app_dir("priv/data/")
  end
end
