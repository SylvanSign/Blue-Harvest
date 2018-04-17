defmodule Router.Static do
  use Plug.Builder

  plug(:redirect_root_to_index)

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
