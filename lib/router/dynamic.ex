require Logger

defmodule Router.Dynamic do
  use Plug.Router
  import Data.AlexaSimilarSites
  import Data.SiteDescription

  plug(:match)
  plug(:fetch_query_params)
  plug(:dispatch)

  get "/similar-sites" do
    case conn.query_params do
      %{"site" => site} ->
        handle_similar_sites(conn, site)

      _ ->
        handle_error(conn)
    end
  end

  get "/description" do
    case conn.query_params do
      %{"site" => site} ->
        handle_site_description(conn, site)

      _ ->
        handle_error(conn)
    end
  end

  match _ do
    send_resp(conn, 404, "")
  end

  def handle_similar_sites(conn, site) do
    similar_sites_list = site |> URI.decode() |> get_similar_sites() |> Enum.map(&elem(&1, 0))
    similar_sites_json = Jason.encode!(%{similarSites: similar_sites_list})

    conn
    |> put_resp_content_type("text/json")
    |> send_resp(200, similar_sites_json)
  end

  def handle_site_description(conn, site) do
    description = site |> URI.decode() |> get_site_description()
    description_json = Jason.encode!(%{description: description})

    conn
    |> put_resp_content_type("text/json")
    |> send_resp(200, description_json)
  end

  def handle_error(conn) do
    send_resp(conn, 400, "Bad Request!")
  end

  def fetch_query_params(conn) do
    Plug.Conn.fetch_query_params(conn)
  end
end
