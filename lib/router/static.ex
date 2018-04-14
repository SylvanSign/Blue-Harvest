defmodule Router.Static do
  use Plug.Builder

  plug(:redirect_root_to_index)

  # TEMP, this seems to fix my caching issue during development
  plug(
    Plug.Static,
    at: "/",
    from: "./priv/static/"
  )

  plug(
    Plug.Static,
    at: "/",
    from: :site_hiker
  )

  def redirect_root_to_index(conn = %Plug.Conn{path_info: []}, _opts) do
    %Plug.Conn{conn | path_info: ["index.html"]}
  end

  def redirect_root_to_index(conn, _opts) do
    conn
  end
end
