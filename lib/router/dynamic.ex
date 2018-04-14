require Logger

defmodule Router.Dynamic do
  use Plug.Router
  import Data.AlexaSiteInfo
  import Data.SiteDescription
  import Data.Favicon

  plug(:match)
  plug(:fetch_query_params)
  plug(:sanitize_site_param)
  plug(:dispatch)

  get "/validate" do
    case conn.query_params do
      %{"site" => site} ->
        handle_validate(conn, site)

      _ ->
        handle_error(conn)
    end
  end

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

  get "/image" do
    case conn.query_params do
      %{"site" => site} ->
        handle_image(conn, site)

      _ ->
        handle_error(conn)
    end
  end

  match _ do
    send_resp(conn, 404, "")
  end

  def handle_validate(conn, site) do
    similar_sites_list = site |> URI.decode() |> get_similar_sites()

    valid_site_name =
      case similar_sites_list do
        :error -> :error
        _ -> site
      end

    valid_json = Jason.encode!(%{valid: valid_site_name})

    conn
    |> put_resp_content_type("text/json")
    |> send_resp(200, valid_json)
  end

  def handle_similar_sites(conn, site) do
    similar_sites_list = site |> URI.decode() |> get_similar_sites()
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

  def handle_image(conn, site) do
    image = site |> URI.decode() |> get_site_image()

    conn
    |> put_resp_content_type("image/png")
    |> send_resp(200, image)
  end

  def handle_error(conn) do
    send_resp(conn, 400, "Bad Request!")
  end

  def sanitize_site_param(conn, _opts) do
    case conn.query_params do
      %{"site" => site} ->
        sanitized_query_params = %{conn.query_params | "site" => Util.URL.clean(site)}
        %{conn | query_params: sanitized_query_params}

      _ ->
        conn
    end
  end
end
